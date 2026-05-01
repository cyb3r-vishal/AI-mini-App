import { z } from 'zod';

/**
 * CSV import — shared contracts.
 *
 * Flow:
 *   1. Client uploads the CSV → server parses + returns `ImportPreview`.
 *   2. Client picks a mapping (CSV column → entity field key).
 *   3. Client POSTs `ImportCommitInput` → server re-validates + inserts.
 */

export const IMPORT_ROW_LIMIT = 10_000;

export const ImportPreviewSchema = z.object({
  /** Opaque id the client echoes back on commit. */
  uploadId: z.string(),
  /** CSV column names (in order). */
  columns: z.array(z.string()),
  /** First N raw rows — strings only (before validation). */
  sampleRows: z.array(z.record(z.string(), z.string())),
  /** Total number of data rows in the file. */
  rowCount: z.number().int().nonnegative(),
  /** Server's best-guess mapping: csv column → entity field key. */
  suggestedMapping: z.record(z.string(), z.string()),
  /** Parser-level warnings (malformed quotes, duplicate columns, etc.). */
  warnings: z.array(z.string()),
});

export const ImportCommitInputSchema = z.object({
  uploadId: z.string().min(1),
  /** Mapping of CSV column name → entity field key. Omitted columns are ignored. */
  mapping: z.record(z.string(), z.string()),
  /** When true, continue inserting valid rows and report invalid ones separately. */
  skipInvalid: z.boolean().default(true),
});

export const ImportRowErrorSchema = z.object({
  rowNumber: z.number().int().positive(), // 1-based, header excluded
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});

export const ImportCommitResultSchema = z.object({
  inserted: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.array(ImportRowErrorSchema),
});

export type ImportPreview = z.infer<typeof ImportPreviewSchema>;
export type ImportCommitInput = z.infer<typeof ImportCommitInputSchema>;
export type ImportRowError = z.infer<typeof ImportRowErrorSchema>;
export type ImportCommitResult = z.infer<typeof ImportCommitResultSchema>;
