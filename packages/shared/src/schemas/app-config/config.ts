import { z } from 'zod';
import { IdSchema, LabelSchema } from './primitives.js';
import { ThemeSchema } from './theme.js';
import { AuthSettingsSchema } from './auth.js';
import { EntitySchema } from './entity.js';
import { PageSchema } from './page.js';

/**
 * Root AppConfig — the JSON blob consumed by the runtime generator.
 *
 * NOTE: This is the **strict** schema. Use the normalization pipeline in
 * `normalize.ts` when accepting user-supplied configs; it wraps this in
 * a fault-tolerant layer and collects warnings.
 */
export const AppConfigSchema = z.object({
  schemaVersion: z.literal(1).default(1),

  id: IdSchema,
  name: LabelSchema,
  description: z.string().max(1000).optional(),
  version: z.string().trim().min(1).max(40).default('0.0.1'),

  theme: ThemeSchema,
  auth: AuthSettingsSchema,

  entities: z.array(EntitySchema).default([]),
  pages: z.array(PageSchema).default([]),

  /** Feature flags / runtime toggles. Unknown keys are preserved. */
  features: z.record(z.string(), z.boolean()).default({}),

  /** Optional free-form metadata (kept as-is). */
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type AppConfigInput = z.input<typeof AppConfigSchema>;
