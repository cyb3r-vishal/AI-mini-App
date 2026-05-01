import { z } from 'zod';
import { AppConfigSchema, type AppConfig } from './config.js';
import { EntitySchema, FieldSchema, FIELD_TYPES } from './entity.js';
import { PageSchema, PAGE_TYPES, WidgetSchema, WIDGET_TYPES } from './page.js';

/**
 * =============================================================================
 * Fault-tolerant validation + normalization pipeline.
 * =============================================================================
 *
 * Goals:
 *  1. Never throw. Always return a `NormalizeResult`.
 *  2. Provide sensible defaults when fields are missing.
 *  3. Drop individual bad items (unknown page types, malformed fields,
 *     unknown widget types) instead of rejecting the whole config.
 *  4. Collect human-readable `issues` so the UI can surface them.
 *  5. Enforce cross-entity referential sanity (pages point at real entities,
 *     relations point at real entities, dedup keys).
 *
 * Pipeline stages:
 *   input (unknown)
 *     -> stage 1: coerce root shape (object, defaults)
 *     -> stage 2: filter entities (drop unknown field types, dedup keys)
 *     -> stage 3: filter pages (drop unknown page/widget types, dedup keys)
 *     -> stage 4: cross-reference check (page.entity → entity.key, etc.)
 *     -> stage 5: final strict parse of the cleaned object
 *   output: NormalizeResult<AppConfig>
 */

export interface NormalizeIssue {
  path: string;
  code: string;
  message: string;
}

export interface NormalizeResult<T> {
  ok: boolean;
  /** Normalized, safe config. Present even when there are issues (best-effort). */
  config: T;
  /** Non-fatal issues (warnings + auto-fixes). */
  issues: NormalizeIssue[];
}

// =============================================================================
// Helpers
// =============================================================================

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const FIELD_TYPE_SET = new Set<string>(FIELD_TYPES);
const PAGE_TYPE_SET = new Set<string>(PAGE_TYPES);
const WIDGET_TYPE_SET = new Set<string>(WIDGET_TYPES);

/** Deduplicate objects by a key, keeping the first occurrence; records dropped dupes. */
function dedupBy<T extends Record<string, unknown>>(
  items: T[],
  keyName: keyof T,
  pathPrefix: string,
  issues: NormalizeIssue[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  items.forEach((item, i) => {
    const raw = item[keyName];
    const key = typeof raw === 'string' ? raw.toLowerCase() : '';
    if (!key) return;
    if (seen.has(key)) {
      issues.push({
        path: `${pathPrefix}[${i}].${String(keyName)}`,
        code: 'DUPLICATE_KEY',
        message: `Duplicate key "${key}" — skipping this item`,
      });
      return;
    }
    seen.add(key);
    out.push(item);
  });
  return out;
}

// =============================================================================
// Stage 1 — coerce root shape
// =============================================================================
/** Accept the input as an object; fabricate a skeleton when it isn't. */
function coerceRootShape(input: unknown, issues: NormalizeIssue[]): Record<string, unknown> {
  if (!isRecord(input)) {
    issues.push({
      path: '',
      code: 'ROOT_NOT_OBJECT',
      message: 'Config must be an object; replaced with an empty config.',
    });
    return {};
  }
  return { ...input };
}

// =============================================================================
// Stage 2 — clean entities
// =============================================================================
function cleanEntities(
  rawEntities: unknown,
  issues: NormalizeIssue[],
): Array<Record<string, unknown>> {
  if (rawEntities === undefined || rawEntities === null) return [];
  if (!Array.isArray(rawEntities)) {
    issues.push({
      path: 'entities',
      code: 'ENTITIES_NOT_ARRAY',
      message: 'entities must be an array; ignoring.',
    });
    return [];
  }

  const cleaned: Array<Record<string, unknown>> = [];

  rawEntities.forEach((entity, eIdx) => {
    if (!isRecord(entity)) {
      issues.push({
        path: `entities[${eIdx}]`,
        code: 'ENTITY_NOT_OBJECT',
        message: 'Entity must be an object; dropped.',
      });
      return;
    }

    // Clean fields: drop ones with unknown types or that fail schema.
    const rawFields = Array.isArray(entity.fields) ? entity.fields : [];
    const keptFields: unknown[] = [];

    rawFields.forEach((field, fIdx) => {
      if (!isRecord(field)) {
        issues.push({
          path: `entities[${eIdx}].fields[${fIdx}]`,
          code: 'FIELD_NOT_OBJECT',
          message: 'Field must be an object; dropped.',
        });
        return;
      }
      const fieldType = field.type;
      if (typeof fieldType !== 'string' || !FIELD_TYPE_SET.has(fieldType)) {
        issues.push({
          path: `entities[${eIdx}].fields[${fIdx}].type`,
          code: 'UNKNOWN_FIELD_TYPE',
          message: `Unknown field type "${String(fieldType)}"; dropped.`,
        });
        return;
      }
      // Probe-parse with the strict FieldSchema.
      const parsed = FieldSchema.safeParse(field);
      if (!parsed.success) {
        issues.push({
          path: `entities[${eIdx}].fields[${fIdx}]`,
          code: 'INVALID_FIELD',
          message: `Invalid field "${String(field.key)}": ${parsed.error.issues[0]?.message ?? 'validation failed'}; dropped.`,
        });
        return;
      }
      keptFields.push(field);
    });

    // De-dup field keys within this entity.
    const dedupedFields = dedupBy(
      keptFields.filter(isRecord),
      'key',
      `entities[${eIdx}].fields`,
      issues,
    );

    cleaned.push({ ...entity, fields: dedupedFields });
  });

  // De-dup entity keys.
  return dedupBy(cleaned, 'key', 'entities', issues);
}

// =============================================================================
// Stage 3 — clean pages
// =============================================================================
function cleanPages(
  rawPages: unknown,
  issues: NormalizeIssue[],
): Array<Record<string, unknown>> {
  if (rawPages === undefined || rawPages === null) return [];
  if (!Array.isArray(rawPages)) {
    issues.push({
      path: 'pages',
      code: 'PAGES_NOT_ARRAY',
      message: 'pages must be an array; ignoring.',
    });
    return [];
  }

  const cleaned: Array<Record<string, unknown>> = [];

  rawPages.forEach((page, pIdx) => {
    if (!isRecord(page)) {
      issues.push({
        path: `pages[${pIdx}]`,
        code: 'PAGE_NOT_OBJECT',
        message: 'Page must be an object; dropped.',
      });
      return;
    }
    const pageType = page.type;
    if (typeof pageType !== 'string' || !PAGE_TYPE_SET.has(pageType)) {
      issues.push({
        path: `pages[${pIdx}].type`,
        code: 'UNKNOWN_PAGE_TYPE',
        message: `Unknown page type "${String(pageType)}"; dropped.`,
      });
      return;
    }

    // For dashboards: filter widgets with unknown types / bad shapes.
    if (pageType === 'dashboard') {
      const rawWidgets = Array.isArray(page.widgets) ? page.widgets : [];
      const keptWidgets: unknown[] = [];
      rawWidgets.forEach((w, wIdx) => {
        if (!isRecord(w)) {
          issues.push({
            path: `pages[${pIdx}].widgets[${wIdx}]`,
            code: 'WIDGET_NOT_OBJECT',
            message: 'Widget must be an object; dropped.',
          });
          return;
        }
        const wt = w.type;
        if (typeof wt !== 'string' || !WIDGET_TYPE_SET.has(wt)) {
          issues.push({
            path: `pages[${pIdx}].widgets[${wIdx}].type`,
            code: 'UNKNOWN_WIDGET_TYPE',
            message: `Unknown widget type "${String(wt)}"; dropped.`,
          });
          return;
        }
        const parsed = WidgetSchema.safeParse(w);
        if (!parsed.success) {
          issues.push({
            path: `pages[${pIdx}].widgets[${wIdx}]`,
            code: 'INVALID_WIDGET',
            message: `Invalid widget: ${parsed.error.issues[0]?.message ?? 'validation failed'}; dropped.`,
          });
          return;
        }
        keptWidgets.push(w);
      });
      cleaned.push({ ...page, widgets: keptWidgets });
      return;
    }

    // Probe-parse non-dashboard pages.
    const parsed = PageSchema.safeParse(page);
    if (!parsed.success) {
      issues.push({
        path: `pages[${pIdx}]`,
        code: 'INVALID_PAGE',
        message: `Invalid page "${String(page.key)}": ${parsed.error.issues[0]?.message ?? 'validation failed'}; dropped.`,
      });
      return;
    }
    cleaned.push(page);
  });

  return dedupBy(cleaned, 'key', 'pages', issues);
}

// =============================================================================
// Stage 4 — cross-reference sanity
// =============================================================================
function resolveReferences(
  cleanedEntities: Array<Record<string, unknown>>,
  cleanedPages: Array<Record<string, unknown>>,
  issues: NormalizeIssue[],
): {
  entities: Array<Record<string, unknown>>;
  pages: Array<Record<string, unknown>>;
} {
  const entityKeys = new Set(
    cleanedEntities.map((e) => String(e.key ?? '').toLowerCase()).filter(Boolean),
  );

  // 4a. Relation fields must point at a known entity.
  const entities = cleanedEntities.map((e, eIdx) => {
    const fields = Array.isArray(e.fields) ? (e.fields as Array<Record<string, unknown>>) : [];
    const filtered = fields.filter((f, fIdx) => {
      if (f.type !== 'relation') return true;
      const target = String(f.entity ?? '').toLowerCase();
      if (!entityKeys.has(target)) {
        issues.push({
          path: `entities[${eIdx}].fields[${fIdx}].entity`,
          code: 'UNKNOWN_RELATION_TARGET',
          message: `Relation field "${String(f.key)}" references unknown entity "${target}"; dropped.`,
        });
        return false;
      }
      return true;
    });
    return { ...e, fields: filtered };
  });

  // 4b. Pages must reference a known entity (except dashboards, which scope per widget).
  const pages = cleanedPages.filter((p, pIdx) => {
    if (p.type === 'dashboard') return true;
    const target = String(p.entity ?? '').toLowerCase();
    if (!entityKeys.has(target)) {
      issues.push({
        path: `pages[${pIdx}].entity`,
        code: 'UNKNOWN_PAGE_ENTITY',
        message: `Page "${String(p.key)}" references unknown entity "${target}"; dropped.`,
      });
      return false;
    }
    return true;
  });

  // 4c. Dashboard widgets that reference entities must exist too.
  const pagesWithWidgets = pages.map((p, pIdx) => {
    if (p.type !== 'dashboard') return p;
    const widgets = Array.isArray(p.widgets) ? (p.widgets as Array<Record<string, unknown>>) : [];
    const kept = widgets.filter((w, wIdx) => {
      if (w.type === 'markdown') return true;
      const target = String(w.entity ?? '').toLowerCase();
      if (!entityKeys.has(target)) {
        issues.push({
          path: `pages[${pIdx}].widgets[${wIdx}].entity`,
          code: 'UNKNOWN_WIDGET_ENTITY',
          message: `Widget "${String(w.key)}" references unknown entity "${target}"; dropped.`,
        });
        return false;
      }
      return true;
    });
    return { ...p, widgets: kept };
  });

  return { entities, pages: pagesWithWidgets };
}

// =============================================================================
// Stage 5 — final strict parse
// =============================================================================
/**
 * Safe, last-resort fallback used if everything else explodes.
 * Guaranteed to satisfy `AppConfigSchema` at runtime.
 */
function fallbackConfig(): AppConfig {
  return AppConfigSchema.parse({
    id: 'untitled-app',
    name: 'Untitled App',
  });
}

/**
 * Main entry point. Never throws.
 */
export function normalizeAppConfig(input: unknown): NormalizeResult<AppConfig> {
  const issues: NormalizeIssue[] = [];

  // Stage 1: root shape
  const root = coerceRootShape(input, issues);

  // Provide required identity defaults when missing.
  if (typeof root.id !== 'string' || !root.id.trim()) {
    issues.push({
      path: 'id',
      code: 'MISSING_ID',
      message: 'Missing "id" — defaulted to "untitled-app".',
    });
    root.id = 'untitled-app';
  }
  if (typeof root.name !== 'string' || !root.name.trim()) {
    issues.push({
      path: 'name',
      code: 'MISSING_NAME',
      message: 'Missing "name" — defaulted to "Untitled App".',
    });
    root.name = 'Untitled App';
  }

  // Stages 2 & 3: clean entities / pages.
  const cleanedEntities = cleanEntities(root.entities, issues);
  const cleanedPages = cleanPages(root.pages, issues);

  // Stage 4: cross-ref.
  const { entities, pages } = resolveReferences(cleanedEntities, cleanedPages, issues);

  root.entities = entities;
  root.pages = pages;

  // Stage 5: strict parse. If it still fails (shouldn't, after cleaning),
  // surface the errors as issues and return the fallback config.
  const parsed = AppConfigSchema.safeParse(root);
  if (!parsed.success) {
    for (const iss of parsed.error.issues) {
      issues.push({
        path: iss.path.join('.'),
        code: `ZOD_${iss.code.toUpperCase()}`,
        message: iss.message,
      });
    }
    return { ok: false, config: fallbackConfig(), issues };
  }

  return { ok: issues.length === 0, config: parsed.data, issues };
}

/**
 * Lightweight read-only validator. Like `normalizeAppConfig` but returns
 * a classic Zod-style result without auto-fixing. Useful for the editor
 * where you want to show errors without silently mutating the user's JSON.
 */
export function validateAppConfig(
  input: unknown,
): { ok: true; data: AppConfig } | { ok: false; error: z.ZodError } {
  const parsed = AppConfigSchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, error: parsed.error };
}
