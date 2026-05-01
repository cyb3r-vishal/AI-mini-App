import type { ListRecordsQuery } from '@ai-gen/shared';
import { asyncHandler } from '../../utils/async-handler.js';
import { HttpError } from '../../utils/http-error.js';
import { recordService, type RecordContext } from './record.service.js';

interface RecordParams extends Record<string, string> {
  id: string; // app id
  entity: string; // entity key
  recordId: string; // optional in practice; Express typing still needs it indexed
}

function ctxFromRequest(req: {
  auth?: { userId: string; email: string };
  params: RecordParams;
}): RecordContext {
  if (!req.auth) throw HttpError.unauthorized();
  return {
    ownerId: req.auth.userId,
    appId: req.params.id,
    entityKey: req.params.entity,
    actor: { userId: req.auth.userId, email: req.auth.email },
  };
}

export const recordController = {
  create: asyncHandler<RecordParams>(async (req, res) => {
    const record = await recordService.create(ctxFromRequest(req), req.body);
    res.status(201).json({ ok: true, data: record });
  }),

  list: asyncHandler<RecordParams>(async (req, res) => {
    const query = (req.validatedQuery ?? {}) as ListRecordsQuery;
    const result = await recordService.list(ctxFromRequest(req), query);
    res.json({ ok: true, data: result });
  }),

  get: asyncHandler<Required<RecordParams>>(async (req, res) => {
    const record = await recordService.get(ctxFromRequest(req), req.params.recordId);
    res.json({ ok: true, data: record });
  }),

  update: asyncHandler<Required<RecordParams>>(async (req, res) => {
    const record = await recordService.update(
      ctxFromRequest(req),
      req.params.recordId,
      req.body,
    );
    res.json({ ok: true, data: record });
  }),

  remove: asyncHandler<Required<RecordParams>>(async (req, res) => {
    await recordService.delete(ctxFromRequest(req), req.params.recordId);
    res.status(204).end();
  }),
};
