import { z } from 'zod';

/**
 * Body schema for `POST /ai/generate-config`.
 *
 * The prompt is a natural-language description of the app the user wants.
 * `slug`/`name` are optional hints — if provided they're injected into the
 * system prompt so the LLM uses them as the config `id` and `name`.
 */
export const GenerateConfigInputSchema = z.object({
  prompt: z.string().trim().min(4, 'Describe the app in at least a few words').max(4000),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, 'Slug must be URL-safe')
    .max(60)
    .optional(),
  name: z.string().trim().min(1).max(80).optional(),
});

export type GenerateConfigInput = z.infer<typeof GenerateConfigInputSchema>;
