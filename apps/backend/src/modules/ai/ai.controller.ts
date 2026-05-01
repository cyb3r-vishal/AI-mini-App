import { asyncHandler, type ParamsDictionary } from '../../utils/async-handler.js';
import { aiService } from './ai.service.js';
import type { GenerateConfigInput } from './ai.schema.js';

export const aiController = {
  generateConfig: asyncHandler<ParamsDictionary, unknown, GenerateConfigInput>(
    async (req, res) => {
      const result = await aiService.generateConfig(req.body.prompt, {
        slug: req.body.slug,
        name: req.body.name,
      });
      res.json({ ok: true, data: result });
    },
  ),
};
