import { z } from 'zod';

/**
 * Low-level primitives shared across the config schema.
 */

/** machine-safe id: lowercase letters, digits, underscore, dash. */
export const IdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_-]*$/i, 'Must start with a letter; only a-z, 0-9, _, - allowed')
  .transform((s) => s.toLowerCase());

/** Tolerant hex color. Falls back to #000 if unparseable. */
export const HexColorSchema = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Expected hex color like #1e293b')
  .transform((s) => s.toLowerCase());

export const IconSchema = z.string().trim().min(1).max(64);

/** Permissive label — anything printable, trimmed, max 200 chars. */
export const LabelSchema = z.string().trim().min(1).max(200);
