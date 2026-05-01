import crypto from 'node:crypto';
import type { Prisma } from '@prisma/client';
import {
  buildCreateSchema,
  applyDefaults,
  type Entity,
  type Field,
  type ImportCommitResult,
  type ImportPreview,
  type ImportRowError,
  IMPORT_ROW_LIMIT,
} from '@ai-gen/shared';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { appService } from '../apps/app.service.js';
import { parseCsv } from './csv-parser.js';

/**
 * CSV import.
 *
 * Two-step flow:
 *   1. uploadPreview(file) → parses CSV, stashes rows in memory, returns a
 *                            small sample + suggested column mapping.
 *   2. commit(uploadId, mapping, skipInvalid) → coerces types, validates each
 *      row with the shared Zod builder, bulk-inserts with `createMany`.
 *
 * We keep parsed uploads in an in-memory TTL cache so the mapping UI can iterate
 * without re-uploading. Good enough for a single-instance deployment; swap for
 * Redis or object storage when scaling out.
 */

const PREVIEW_SAMPLE_SIZE = 20;
const UPLOAD_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CachedUpload {
  ownerId: string;
  appId: string;
  entityKey: string;
  columns: string[];
  rows: Array<Record<string, string>>;
  warnings: string[];
  expiresAt: number;
}

const uploads = new Map<string, CachedUpload>();

function sweep() {
  const now = Date.now();
  for (const [id, u] of uploads) if (u.expiresAt < now) uploads.delete(id);
}

// ---------------------------------------------------------------------------
// Mapping suggestions
// ---------------------------------------------------------------------------

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function suggestMapping(csvColumns: string[], entity: Entity): Record<string, string> {
  const byNorm = new Map<string, Field>();
  for (const f of entity.fields) {
    byNorm.set(normalizeKey(f.key), f);
    if (f.label) byNorm.set(normalizeKey(f.label), f);
  }
  const mapping: Record<string, string> = {};
  for (const col of csvColumns) {
    const hit = byNorm.get(normalizeKey(col));
    if (hit) mapping[col] = hit.key;
  }
  return mapping;
}

// ---------------------------------------------------------------------------
// Type coercion — CSV gives us strings; entity fields want typed values.
// ---------------------------------------------------------------------------

function coerce(raw: string | undefined, field: Field): unknown {
  if (raw === undefined) return undefined;
  const v = raw.trim();
  if (v === '') return undefined;

  switch (field.type) {
    case 'string':
    case 'text':
    case 'email':
    case 'url':
    case 'date':
    case 'datetime':
      return v;

    case 'number': {
      const n = Number(v);
      return Number.isFinite(n) ? n : v; // let Zod reject unparseables
    }

    case 'boolean': {
      const low = v.toLowerCase();
      if (['true', 'yes', '1', 'y'].includes(low)) return true;
      if (['false', 'no', '0', 'n'].includes(low)) return false;
      return v; // let Zod reject
    }

    case 'select': {
      // Preserve option value type when possible.
      const match = field.options.find((o) => String(o.value) === v);
      return match ? match.value : v;
    }

    case 'multiselect': {
      const parts = v
        .split(/[,;|]/)
        .map((p) => p.trim())
        .filter(Boolean);
      return parts.map((p) => {
        const match = field.options.find((o) => String(o.value) === p);
        return match ? match.value : p;
      });
    }

    case 'relation': {
      if (field.cardinality === 'many') {
        return v
          .split(/[,;|]/)
          .map((p) => p.trim())
          .filter(Boolean);
      }
      return v;
    }

    case 'json': {
      try {
        return JSON.parse(v);
      } catch {
        return v; // let Zod keep it as unknown
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const importService = {
  async preview(params: {
    ownerId: string;
    appId: string;
    entityKey: string;
    buffer: Buffer;
  }): Promise<ImportPreview> {
    sweep();

    // Tenant + entity check.
    const { config } = await appService.getActiveConfig(params.ownerId, params.appId);
    const entity = config.entities.find((e) => e.key === params.entityKey);
    if (!entity) throw HttpError.notFound(`Entity "${params.entityKey}" not found`);

    const text = params.buffer.toString('utf-8');
    const parsed = parseCsv(text, { maxRows: IMPORT_ROW_LIMIT });

    if (parsed.columns.length === 0) {
      throw HttpError.badRequest('CSV has no header row');
    }

    const uploadId = crypto.randomUUID();
    uploads.set(uploadId, {
      ownerId: params.ownerId,
      appId: params.appId,
      entityKey: params.entityKey,
      columns: parsed.columns,
      rows: parsed.rows,
      warnings: parsed.warnings,
      expiresAt: Date.now() + UPLOAD_TTL_MS,
    });

    return {
      uploadId,
      columns: parsed.columns,
      sampleRows: parsed.rows.slice(0, PREVIEW_SAMPLE_SIZE),
      rowCount: parsed.rows.length,
      suggestedMapping: suggestMapping(parsed.columns, entity),
      warnings: parsed.warnings,
    };
  },

  async commit(params: {
    ownerId: string;
    uploadId: string;
    mapping: Record<string, string>;
    skipInvalid: boolean;
  }): Promise<ImportCommitResult> {
    sweep();

    const upload = uploads.get(params.uploadId);
    if (!upload) throw HttpError.notFound('Upload expired or not found — please re-upload.');
    if (upload.ownerId !== params.ownerId) throw HttpError.forbidden();

    const { config } = await appService.getActiveConfig(params.ownerId, upload.appId);
    const entity = config.entities.find((e) => e.key === upload.entityKey);
    if (!entity) throw HttpError.notFound(`Entity "${upload.entityKey}" no longer exists`);

    const entityRow = await prisma.entity.findUnique({
      where: { appId_key: { appId: upload.appId, key: entity.key } },
      select: { id: true },
    });
    if (!entityRow) throw HttpError.notFound('Entity not provisioned');

    // Mapping: csv column → field. Filter to known entity fields only.
    const fieldByKey = new Map(entity.fields.map((f) => [f.key, f]));
    const effectiveMapping: Array<{ csvCol: string; field: Field }> = [];
    for (const [csvCol, fieldKey] of Object.entries(params.mapping)) {
      const field = fieldByKey.get(fieldKey);
      if (!field) continue; // silently drop unknown targets
      if (!upload.columns.includes(csvCol)) continue;
      effectiveMapping.push({ csvCol, field });
    }
    if (effectiveMapping.length === 0) {
      throw HttpError.badRequest('No valid column mappings supplied');
    }

    const schema = buildCreateSchema(entity);

    const errors: ImportRowError[] = [];
    const valid: Array<Record<string, unknown>> = [];

    for (let i = 0; i < upload.rows.length; i++) {
      const csvRow = upload.rows[i]!;
      const payload: Record<string, unknown> = {};

      for (const { csvCol, field } of effectiveMapping) {
        const coerced = coerce(csvRow[csvCol], field);
        if (coerced !== undefined) payload[field.key] = coerced;
      }

      const withDefaults = applyDefaults(entity, payload);
      const parsed = schema.safeParse(withDefaults);

      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        const fieldErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(flat)) {
          if (v && v.length > 0) fieldErrors[k] = v[0]!;
        }
        errors.push({
          rowNumber: i + 1,
          message: 'Validation failed',
          fieldErrors,
        });
        if (!params.skipInvalid) break;
        continue;
      }

      valid.push(parsed.data as Record<string, unknown>);
    }

    if (!params.skipInvalid && errors.length > 0) {
      return { inserted: 0, skipped: upload.rows.length, errors };
    }

    // Bulk insert in batches to avoid giant parameter lists.
    const BATCH = 500;
    for (let start = 0; start < valid.length; start += BATCH) {
      const slice = valid.slice(start, start + BATCH);
      await prisma.record.createMany({
        data: slice.map((data) => ({
          entityId: entityRow.id,
          appId: upload.appId,
          ownerId: upload.ownerId,
          data: data as Prisma.InputJsonValue,
        })),
      });
    }

    // One-shot cache invalidation on success.
    uploads.delete(params.uploadId);

    return {
      inserted: valid.length,
      skipped: errors.length,
      errors,
    };
  },
};
