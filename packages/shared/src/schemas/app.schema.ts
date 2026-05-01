import { z } from 'zod';
import { AppConfigSchema } from './app-config/config.js';
import { IdSchema, LabelSchema } from './app-config/primitives.js';

/**
 * Inputs & outputs for the Apps REST surface.
 * The full JSON config is optional at create time — a minimal skeleton is
 * produced by the backend when absent.
 */

export const CreateAppInputSchema = z.object({
  slug: IdSchema,
  name: LabelSchema,
  description: z.string().max(1000).optional(),
  /** Optional initial AppConfig. Will be normalized server-side. */
  config: z.unknown().optional(),
});

export const UpdateAppInputSchema = z.object({
  name: LabelSchema.optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isPublic: z.boolean().optional(),
});

export const PublishAppConfigInputSchema = z.object({
  /** Arbitrary JSON — normalized + versioned on the server. */
  config: z.unknown(),
  notes: z.string().max(500).optional(),
});

export const PublicAppSchema = z.object({
  id: z.string(),
  /** Owner's user id — exposed so the frontend can build share links. */
  ownerId: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  activeConfigVersion: z.number().int().nullable(),
});

/** Query-string schema for listing records. Everything is optional. */
export const ListRecordsQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10_000).default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(25),
  sort: z.string().trim().max(120).optional(), // e.g. "createdAt:desc"
  q: z.string().trim().max(200).optional(),    // free-text search over JSONB
  /** JSON-encoded filter, e.g. {"status":"open"} */
  filter: z.string().optional(),
});

export type CreateAppInput = z.infer<typeof CreateAppInputSchema>;
export type UpdateAppInput = z.infer<typeof UpdateAppInputSchema>;
export type PublishAppConfigInput = z.infer<typeof PublishAppConfigInputSchema>;
export type PublicApp = z.infer<typeof PublicAppSchema>;
export type ListRecordsQuery = z.infer<typeof ListRecordsQuerySchema>;

// Re-export the config schema for convenience.
export { AppConfigSchema };
