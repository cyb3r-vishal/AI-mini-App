import type { Prisma } from '@prisma/client';
import type { AppConfig, Entity, ListRecordsQuery } from '@ai-gen/shared';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { appService } from '../apps/app.service.js';
import { eventBus } from '../../events/event-bus.js';
import {
  applyDefaults,
  buildCreateSchema,
  buildUpdateSchema,
} from './record-schema.builder.js';

/**
 * Dynamic CRUD engine for records.
 *
 *  - Zero entity hardcoding. Validation is generated on the fly from the
 *    active AppConfig's Entity definition.
 *  - Tenant scoping is always applied: the owning App is loaded by (id, ownerId)
 *    before any record operation.
 *  - Record payloads live in JSONB (`records.data`). A GIN index on that column
 *    makes containment queries fast.
 *  - Relation fields check that the referenced record(s) exist in the same app.
 *  - Mutating ops emit events on the in-process bus (see `events/event-bus.ts`).
 *    Consumers (notifications, webhooks, audit logs) subscribe separately.
 */

export interface RecordContext {
  ownerId: string;     // the user requesting — also the tenant owner today
  appId: string;
  entityKey: string;
  actor?: { userId: string; email: string };
}

interface ResolvedContext {
  ownerId: string;
  appId: string;
  appName: string;
  config: AppConfig;
  entity: Entity;
  entityRowId: string; // DB id of the Entity row
}

async function resolveContext(ctx: RecordContext): Promise<ResolvedContext> {
  // 1. Load the app with tenant check; throws 404 if not owned.
  const { app, config } = await appService.getActiveConfig(ctx.ownerId, ctx.appId);

  // 2. Find the entity in the config (source of truth for validation).
  const entity = config.entities.find((e) => e.key === ctx.entityKey);
  if (!entity) throw HttpError.notFound(`Entity "${ctx.entityKey}" not found`);

  // 3. Resolve the DB row — should always exist after entity sync, but be defensive.
  const row = await prisma.entity.findUnique({
    where: { appId_key: { appId: app.id, key: entity.key } },
    select: { id: true },
  });
  if (!row) throw HttpError.notFound(`Entity "${ctx.entityKey}" not provisioned`);

  return {
    ownerId: app.ownerId,
    appId: app.id,
    appName: app.name,
    config,
    entity,
    entityRowId: row.id,
  };
}

/** Verify relation targets exist inside the same app. */
async function verifyRelations(
  resolved: ResolvedContext,
  data: Record<string, unknown>,
): Promise<void> {
  for (const field of resolved.entity.fields) {
    if (field.type !== 'relation') continue;
    const value = data[field.key];
    if (value === undefined || value === null) continue;

    const ids = Array.isArray(value) ? value : [value];
    const strIds = ids.filter((v): v is string => typeof v === 'string' && v.length > 0);
    if (strIds.length === 0) continue;

    // Locate the target entity row for this relation.
    const targetRow = await prisma.entity.findUnique({
      where: { appId_key: { appId: resolved.appId, key: field.entity } },
      select: { id: true },
    });
    if (!targetRow) {
      throw HttpError.badRequest(`Relation target "${field.entity}" is not provisioned`);
    }

    const count = await prisma.record.count({
      where: {
        id: { in: strIds },
        entityId: targetRow.id,
        appId: resolved.appId,
        isDeleted: false,
      },
    });
    if (count !== strIds.length) {
      throw HttpError.badRequest(
        `Relation "${field.key}" references record(s) that don't exist in "${field.entity}"`,
      );
    }
  }
}

function serializeRecord(r: {
  id: string;
  data: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): Record<string, unknown> {
  return {
    id: r.id,
    data: r.data,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

function parseSort(sort: string | undefined): Prisma.RecordOrderByWithRelationInput {
  // "createdAt:desc" or "updatedAt:asc" — we only support native columns for now.
  if (!sort) return { createdAt: 'desc' };
  const [field, dir] = sort.split(':');
  const direction = dir === 'asc' ? 'asc' : 'desc';
  if (field === 'createdAt' || field === 'updatedAt') {
    return { [field]: direction } as Prisma.RecordOrderByWithRelationInput;
  }
  return { createdAt: 'desc' };
}

function parseJsonFilter(filter: string | undefined): Prisma.InputJsonValue | undefined {
  if (!filter) return undefined;
  try {
    const parsed = JSON.parse(filter) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Prisma.InputJsonValue;
    }
  } catch {
    /* fallthrough */
  }
  throw HttpError.badRequest('Invalid `filter` query — must be a JSON object string');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const recordService = {
  async create(ctx: RecordContext, payload: unknown): Promise<Record<string, unknown>> {
    const resolved = await resolveContext(ctx);

    const schema = buildCreateSchema(resolved.entity);
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw HttpError.badRequest('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const data = applyDefaults(resolved.entity, parsed.data as Record<string, unknown>);
    await verifyRelations(resolved, data);

    // Uniqueness — the config may mark fields `unique:true`. We enforce at app-time
    // to stay JSONB-agnostic (rather than per-field SQL indexes).
    for (const field of resolved.entity.fields) {
      if (!field.unique) continue;
      const value = data[field.key];
      if (value === undefined || value === null) continue;
      const clash = await prisma.record.findFirst({
        where: {
          entityId: resolved.entityRowId,
          isDeleted: false,
          data: { path: [field.key], equals: value as Prisma.InputJsonValue },
        },
        select: { id: true },
      });
      if (clash) {
        throw HttpError.conflict(`Field "${field.key}" must be unique`);
      }
    }

    const created = await prisma.record.create({
      data: {
        entityId: resolved.entityRowId,
        appId: resolved.appId,
        ownerId: resolved.ownerId,
        data: data as Prisma.InputJsonValue,
      },
    });

    // Fire-and-forget event.
    eventBus.emit('record.created', {
      ownerId: resolved.ownerId,
      appId: resolved.appId,
      appName: resolved.appName,
      entityKey: resolved.entity.key,
      entityName: resolved.entity.name,
      recordId: created.id,
      data,
      actor: ctx.actor ?? { userId: ctx.ownerId, email: '' },
    });

    return serializeRecord(created);
  },

  async list(
    ctx: RecordContext,
    query: ListRecordsQuery,
  ): Promise<{
    items: Array<Record<string, unknown>>;
    page: number;
    pageSize: number;
    total: number;
  }> {
    const resolved = await resolveContext(ctx);

    const jsonFilter = parseJsonFilter(query.filter);
    const where: Prisma.RecordWhereInput = {
      entityId: resolved.entityRowId,
      appId: resolved.appId,
      ownerId: resolved.ownerId, // defense-in-depth
      isDeleted: false,
    };

    // Fast path: JSONB containment (uses the GIN index).
    if (jsonFilter) {
      where.data = { path: [], equals: undefined }; // placeholder so TS is happy
      // Prisma JSONB operators:
      (where as Prisma.RecordWhereInput).data = {
        path: [],
        // `string_contains` is for strings; for objects we use raw-ish API:
      } as Prisma.JsonFilter;
      // Use the `equals`/`path` combo: emulate `@>` using Prisma's nested operator.
      // Prisma exposes `data: { equals: {...} }` for exact match; for containment
      // we use `data: { path: [key], equals: value }` on each top-level key.
      delete (where as { data?: unknown }).data;
      const filterAnd: Prisma.RecordWhereInput[] = Object.entries(
        jsonFilter as Record<string, unknown>,
      ).map(([k, v]) => ({
        data: { path: [k], equals: v as Prisma.InputJsonValue },
      }));
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), ...filterAnd];
    }

    // Free-text search: match any string value in the JSONB payload.
    if (query.q) {
      // Prisma supports `string_contains` at a specific JSON path. A generic
      // search across arbitrary keys requires raw SQL; for now we expose `q`
      // as a convenience for callers who know which fields are strings and
      // fall back to `filter` otherwise.
      where.OR = resolved.entity.fields
        .filter((f) => ['string', 'text', 'email', 'url'].includes(f.type))
        .map((f) => ({
          data: {
            path: [f.key],
            string_contains: query.q!,
          } as Prisma.JsonFilter,
        }));
      if ((where.OR as unknown[]).length === 0) delete where.OR;
    }

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.record.findMany({
        where,
        orderBy: parseSort(query.sort),
        skip,
        take: query.pageSize,
      }),
      prisma.record.count({ where }),
    ]);

    return {
      items: items.map(serializeRecord),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  },

  async get(ctx: RecordContext, recordId: string): Promise<Record<string, unknown>> {
    const resolved = await resolveContext(ctx);
    const record = await prisma.record.findFirst({
      where: {
        id: recordId,
        entityId: resolved.entityRowId,
        ownerId: resolved.ownerId,
        isDeleted: false,
      },
    });
    if (!record) throw HttpError.notFound('Record not found');
    return serializeRecord(record);
  },

  async update(
    ctx: RecordContext,
    recordId: string,
    payload: unknown,
  ): Promise<Record<string, unknown>> {
    const resolved = await resolveContext(ctx);

    const existing = await prisma.record.findFirst({
      where: {
        id: recordId,
        entityId: resolved.entityRowId,
        ownerId: resolved.ownerId,
        isDeleted: false,
      },
    });
    if (!existing) throw HttpError.notFound('Record not found');

    const schema = buildUpdateSchema(resolved.entity);
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw HttpError.badRequest('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const patch = parsed.data as Record<string, unknown>;
    await verifyRelations(resolved, patch);

    // Unique check for changed fields.
    for (const field of resolved.entity.fields) {
      if (!field.unique) continue;
      if (!(field.key in patch)) continue;
      const value = patch[field.key];
      if (value === undefined || value === null) continue;
      const clash = await prisma.record.findFirst({
        where: {
          entityId: resolved.entityRowId,
          isDeleted: false,
          id: { not: recordId },
          data: { path: [field.key], equals: value as Prisma.InputJsonValue },
        },
        select: { id: true },
      });
      if (clash) throw HttpError.conflict(`Field "${field.key}" must be unique`);
    }

    const currentData = (existing.data ?? {}) as Record<string, unknown>;
    const nextData: Record<string, unknown> = { ...currentData };
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) delete nextData[k];
      else nextData[k] = v;
    }

    const updated = await prisma.record.update({
      where: { id: existing.id },
      data: { data: nextData as Prisma.InputJsonValue },
    });

    eventBus.emit('record.updated', {
      ownerId: resolved.ownerId,
      appId: resolved.appId,
      appName: resolved.appName,
      entityKey: resolved.entity.key,
      entityName: resolved.entity.name,
      recordId: updated.id,
      data: nextData,
      previousData: currentData,
      actor: ctx.actor ?? { userId: ctx.ownerId, email: '' },
    });

    return serializeRecord(updated);
  },

  async delete(ctx: RecordContext, recordId: string): Promise<void> {
    const resolved = await resolveContext(ctx);
    const existing = await prisma.record.findFirst({
      where: {
        id: recordId,
        entityId: resolved.entityRowId,
        ownerId: resolved.ownerId,
        isDeleted: false,
      },
      select: { id: true },
    });
    if (!existing) throw HttpError.notFound('Record not found');

    // Soft delete — keeps history and respects the partial index.
    await prisma.record.update({
      where: { id: existing.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    eventBus.emit('record.deleted', {
      ownerId: resolved.ownerId,
      appId: resolved.appId,
      appName: resolved.appName,
      entityKey: resolved.entity.key,
      entityName: resolved.entity.name,
      recordId: existing.id,
      actor: ctx.actor ?? { userId: ctx.ownerId, email: '' },
    });
  },
};
