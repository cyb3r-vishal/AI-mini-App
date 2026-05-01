import { z } from 'zod';
import { IdSchema, LabelSchema } from './primitives.js';

/**
 * Field definitions for an entity.
 *
 * Each field type is its own Zod object. A discriminated union on `type`
 * gives us:
 *  - per-type narrowing in TS
 *  - clean error messages from Zod
 *  - easy extensibility (add a new branch → done)
 *
 * Unknown types are handled at the Entity layer via `catch` + filtering
 * (so a single bad field never crashes the whole config).
 */

export const FIELD_TYPES = [
  'string',
  'text',
  'number',
  'boolean',
  'date',
  'datetime',
  'email',
  'url',
  'select',
  'multiselect',
  'relation',
  'json',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

const BaseField = z.object({
  key: IdSchema,
  label: LabelSchema.optional(),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  indexed: z.boolean().default(false),
  description: z.string().max(500).optional(),
});

// ---------- String-ish -------------------------------------------------------
export const StringFieldSchema = BaseField.extend({
  type: z.literal('string'),
  minLength: z.coerce.number().int().nonnegative().optional(),
  maxLength: z.coerce.number().int().positive().max(10_000).optional(),
  pattern: z.string().optional(),
  defaultValue: z.string().optional(),
});

export const TextFieldSchema = BaseField.extend({
  type: z.literal('text'),
  maxLength: z.coerce.number().int().positive().max(100_000).default(10_000),
  defaultValue: z.string().optional(),
});

export const EmailFieldSchema = BaseField.extend({
  type: z.literal('email'),
  defaultValue: z.string().optional(),
});

export const UrlFieldSchema = BaseField.extend({
  type: z.literal('url'),
  defaultValue: z.string().optional(),
});

// ---------- Numeric ----------------------------------------------------------
export const NumberFieldSchema = BaseField.extend({
  type: z.literal('number'),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  step: z.coerce.number().positive().optional(),
  defaultValue: z.coerce.number().optional(),
});

// ---------- Boolean / Date ---------------------------------------------------
export const BooleanFieldSchema = BaseField.extend({
  type: z.literal('boolean'),
  defaultValue: z.boolean().optional(),
});

export const DateFieldSchema = BaseField.extend({
  type: z.literal('date'),
  defaultValue: z.string().optional(), // ISO date
});

export const DateTimeFieldSchema = BaseField.extend({
  type: z.literal('datetime'),
  defaultValue: z.string().optional(), // ISO datetime
});

// ---------- Choice -----------------------------------------------------------
export const SelectOptionSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
  label: LabelSchema.optional(),
});

export const SelectFieldSchema = BaseField.extend({
  type: z.literal('select'),
  options: z.array(SelectOptionSchema).default([]),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const MultiSelectFieldSchema = BaseField.extend({
  type: z.literal('multiselect'),
  options: z.array(SelectOptionSchema).default([]),
  defaultValue: z.array(z.union([z.string(), z.number(), z.boolean()])).default([]),
});

// ---------- Relation ---------------------------------------------------------
export const RelationFieldSchema = BaseField.extend({
  type: z.literal('relation'),
  /** key of the referenced entity */
  entity: IdSchema,
  cardinality: z.enum(['one', 'many']).catch('one').default('one'),
  onDelete: z.enum(['cascade', 'set-null', 'restrict']).catch('set-null').default('set-null'),
});

// ---------- JSON -------------------------------------------------------------
export const JsonFieldSchema = BaseField.extend({
  type: z.literal('json'),
  defaultValue: z.unknown().optional(),
});

// ---------- Union ------------------------------------------------------------
export const FieldSchema = z.discriminatedUnion('type', [
  StringFieldSchema,
  TextFieldSchema,
  EmailFieldSchema,
  UrlFieldSchema,
  NumberFieldSchema,
  BooleanFieldSchema,
  DateFieldSchema,
  DateTimeFieldSchema,
  SelectFieldSchema,
  MultiSelectFieldSchema,
  RelationFieldSchema,
  JsonFieldSchema,
]);

export type Field = z.infer<typeof FieldSchema>;
export type SelectOption = z.infer<typeof SelectOptionSchema>;

// ---------- Entity -----------------------------------------------------------
export const EntitySchema = z.object({
  key: IdSchema,
  name: LabelSchema,
  description: z.string().max(500).optional(),
  /**
   * Array is tolerant: each item is parsed via `.catch(null)` at normalization
   * time so a single malformed field doesn't discard the whole entity.
   * The raw schema here is strict — normalization layers on the fault tolerance.
   */
  fields: z.array(FieldSchema).default([]),
  /** Optional: which field represents the display title. */
  displayField: IdSchema.optional(),
  /** Optional: which field is sortable by default. */
  sortField: IdSchema.optional(),
  timestamps: z.boolean().default(true),
});

export type Entity = z.infer<typeof EntitySchema>;
