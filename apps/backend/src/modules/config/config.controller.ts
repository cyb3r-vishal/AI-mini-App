import { normalizeAppConfig } from '@ai-gen/shared';
import { asyncHandler } from '../../utils/async-handler.js';

/**
 * Config validation + normalization endpoints.
 * Pure, stateless — no DB access. Useful from the editor UI.
 */
export const configController = {
  /**
   * POST /config/normalize
   * Body: arbitrary JSON (possibly malformed)
   * Returns: { ok, config, issues }  — never 500s.
   */
  normalize: asyncHandler(async (req, res) => {
    const result = normalizeAppConfig(req.body);
    res.json({ ok: true, data: result });
  }),
};
