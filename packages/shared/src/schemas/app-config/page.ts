import { z } from 'zod';
import { IconSchema, IdSchema, LabelSchema } from './primitives.js';

/**
 * Pages: the user-facing surfaces the runtime renders.
 *
 * A config can contain arbitrary page `type` strings. Unknown types are
 * dropped by the normalization pipeline (see `normalize.ts`) rather than
 * failing the entire config.
 */

export const PAGE_TYPES = ['form', 'table', 'dashboard'] as const;
export type PageType = (typeof PAGE_TYPES)[number];

const BasePage = z.object({
  key: IdSchema,
  title: LabelSchema,
  icon: IconSchema.optional(),
  path: z
    .string()
    .trim()
    .regex(/^\/[a-z0-9/_-]*$/i, 'Path must start with / and use URL-safe chars')
    .optional(),
  requireAuth: z.boolean().default(false),
});

// ---------- FORM -------------------------------------------------------------
export const FormPageSchema = BasePage.extend({
  type: z.literal('form'),
  entity: IdSchema,
  /** If omitted, all entity fields are used (in declaration order). */
  fields: z.array(IdSchema).optional(),
  submitLabel: LabelSchema.default('Submit'),
  layout: z.enum(['vertical', 'horizontal', 'grid']).catch('vertical').default('vertical'),
  onSubmit: z
    .object({
      action: z.enum(['create', 'update']).catch('create').default('create'),
      redirectTo: z.string().optional(),
    })
    .default({}),
});

// ---------- TABLE ------------------------------------------------------------
export const TableColumnSchema = z.object({
  field: IdSchema,
  label: LabelSchema.optional(),
  sortable: z.boolean().default(true),
  filterable: z.boolean().default(false),
  width: z.coerce.number().int().positive().max(2000).optional(),
});

export const TablePageSchema = BasePage.extend({
  type: z.literal('table'),
  entity: IdSchema,
  columns: z.array(TableColumnSchema).default([]),
  pageSize: z.coerce.number().int().positive().max(500).default(25),
  searchable: z.boolean().default(true),
  actions: z
    .array(z.enum(['create', 'edit', 'delete', 'view']))
    .default(['create', 'edit', 'delete']),
});

// ---------- DASHBOARD --------------------------------------------------------
export const WIDGET_TYPES = ['metric', 'chart', 'list', 'markdown'] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

const BaseWidget = z.object({
  key: IdSchema,
  title: LabelSchema,
  /** Grid span 1-12. */
  span: z.coerce.number().int().min(1).max(12).default(4),
});

export const MetricWidgetSchema = BaseWidget.extend({
  type: z.literal('metric'),
  entity: IdSchema,
  aggregate: z.enum(['count', 'sum', 'avg', 'min', 'max']).catch('count').default('count'),
  field: IdSchema.optional(),
});

export const ChartWidgetSchema = BaseWidget.extend({
  type: z.literal('chart'),
  entity: IdSchema,
  chartType: z.enum(['line', 'bar', 'pie', 'area']).catch('bar').default('bar'),
  xField: IdSchema,
  yField: IdSchema,
});

export const ListWidgetSchema = BaseWidget.extend({
  type: z.literal('list'),
  entity: IdSchema,
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.enum(['newest', 'oldest']).catch('newest').default('newest'),
});

export const MarkdownWidgetSchema = BaseWidget.extend({
  type: z.literal('markdown'),
  content: z.string().max(20_000).default(''),
});

export const WidgetSchema = z.discriminatedUnion('type', [
  MetricWidgetSchema,
  ChartWidgetSchema,
  ListWidgetSchema,
  MarkdownWidgetSchema,
]);
export type Widget = z.infer<typeof WidgetSchema>;

export const DashboardPageSchema = BasePage.extend({
  type: z.literal('dashboard'),
  widgets: z.array(WidgetSchema).default([]),
});

// ---------- Union ------------------------------------------------------------
export const PageSchema = z.discriminatedUnion('type', [
  FormPageSchema,
  TablePageSchema,
  DashboardPageSchema,
]);

export type Page = z.infer<typeof PageSchema>;
export type FormPage = z.infer<typeof FormPageSchema>;
export type TablePage = z.infer<typeof TablePageSchema>;
export type DashboardPage = z.infer<typeof DashboardPageSchema>;
