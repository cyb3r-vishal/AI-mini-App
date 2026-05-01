import type { ListRecordsQuery } from '@ai-gen/shared';
import { asyncHandler } from '../../utils/async-handler.js';
import { appService } from '../apps/app.service.js';
import { publicService } from './public.service.js';

interface AppParams extends Record<string, string> {
  ownerId: string;
  slug: string;
}
interface EntityParams extends AppParams {
  entity: string;
}

export const publicController = {
  getApp: asyncHandler<AppParams>(async (req, res) => {
    const app = await appService.getPublicApp(req.params.ownerId, req.params.slug);
    res.json({ ok: true, data: app });
  }),

  getConfig: asyncHandler<AppParams>(async (req, res) => {
    const { config } = await appService.getPublicActiveConfig(
      req.params.ownerId,
      req.params.slug,
    );
    res.json({ ok: true, data: config });
  }),

  listRecords: asyncHandler<EntityParams>(async (req, res) => {
    const query = (req.validatedQuery ?? {}) as ListRecordsQuery;
    const result = await publicService.listRecords(
      req.params.ownerId,
      req.params.slug,
      req.params.entity,
      query,
    );
    res.json({ ok: true, data: result });
  }),
};
