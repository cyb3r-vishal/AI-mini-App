/**
 * Compatibility shim — the canonical dynamic builder now lives in `@ai-gen/shared`.
 * Import from '@ai-gen/shared' directly in new code.
 */
export { buildCreateSchema, buildUpdateSchema, applyDefaults } from '@ai-gen/shared';
