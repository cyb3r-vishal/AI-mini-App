import { z, type ZodTypeAny } from 'zod';
import type { Entity, Field } from './entity.js';

/**
 * =============================================================================
 * Dynamic record-schema builder (shared between frontend + backend)
 * =============================================================================
 *
 * Converts an entity definition into a runtime Zod schema for validating a
 * record payload. This lives in `@ai-gen/shared` so the frontend can validate
 * before submit and the backend can validate on receive — with a *single*
 * source of truth.
 */

function buildFieldSchema(field: Field): ZodTypeAny {
  switch (field.type) {
    case 'string': {
      let s = z.string();
      if (field.minLength !== undefined) s = s.min(field.minLength);
      if (field.maxLength !== undefined) s = s.max(field.maxLength);
      if (field.pattern) {
        try {
          s = s.regex(new RegExp(field.pattern));
        } catch {
          /* bad pattern — config was normalized, ignore */
        }
      }
      return s;
    }
    case 'text':
      return z.string().max(field.maxLength);
    case 'email':
      return z.string().email();
    case 'url':
      return z.string().url();
    case 'number': {
      let n = z.number();
      if (field.min !== undefined) n = n.min(field.min);
      if (field.max !== undefined) n = n.max(field.max);
      return n;
    }
    case 'boolean':
      return z.boolean();
    case 'date':
    case 'datetime':
      return z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date');
    case 'select': {
      if (field.options.length === 0) {
        return z.union([z.string(), z.number(), z.boolean()]);
      }
      const allowed = field.options.map((o) => o.value);
      return z.custom((v) => allowed.includes(v as string | number | boolean), {
        message: `Must be one of: ${allowed.map(String).join(', ')}`,
      });
    }
    case 'multiselect': {
      if (field.options.length === 0) {
        return z.array(z.union([z.string(), z.number(), z.boolean()]));
      }
      const allowed = field.options.map((o) => o.value);
      return z.array(
        z.custom((v) => allowed.includes(v as string | number | boolean), {
          message: `Must be one of: ${allowed.map(String).join(', ')}`,
        }),
      );
    }
    case 'relation':
      return field.cardinality === 'many'
        ? z.array(z.string().min(1))
        : z.string().min(1);
    case 'json':
      return z.unknown();
  }
}

function applyRequired(schema: ZodTypeAny, field: Field): ZodTypeAny {
  if (field.required) return schema;
  return schema.nullable().optional();
}

/**
 * Build a strict create-schema for `entity`. Unknown fields are stripped so
 * malformed client payloads can't sneak extra JSON into storage.
 */
export function buildCreateSchema(entity: Entity): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};
  for (const field of entity.fields) {
    shape[field.key] = applyRequired(buildFieldSchema(field), field);
  }
  return z.object(shape).strip();
}

/** All fields optional — used for PUT/PATCH. */
export function buildUpdateSchema(entity: Entity): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};
  for (const field of entity.fields) {
    shape[field.key] = buildFieldSchema(field).nullable().optional();
  }
  return z.object(shape).strip();
}

/** Fill missing keys with declared `defaultValue`s. Does not mutate. */
export function applyDefaults(
  entity: Entity,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...data };
  for (const field of entity.fields) {
    if (out[field.key] !== undefined) continue;
    if ('defaultValue' in field && field.defaultValue !== undefined) {
      out[field.key] = field.defaultValue;
    }
  }
  return out;
}
