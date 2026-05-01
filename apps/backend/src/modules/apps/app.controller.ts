import { asyncHandler, type ParamsDictionary } from '../../utils/async-handler.js';
import { HttpError } from '../../utils/http-error.js';
import { appService } from './app.service.js';
import type {
  CreateAppInput,
  PublishAppConfigInput,
  UpdateAppInput,
} from '@ai-gen/shared';

function ownerId(req: { auth?: { userId: string } }): string {
  if (!req.auth) throw HttpError.unauthorized();
  return req.auth.userId;
}

export const appController = {
  create: asyncHandler<ParamsDictionary, unknown, CreateAppInput>(async (req, res) => {
    const app = await appService.create(ownerId(req), req.body);
    res.status(201).json({ ok: true, data: app });
  }),

  list: asyncHandler(async (req, res) => {
    const apps = await appService.list(ownerId(req));
    res.json({ ok: true, data: apps });
  }),

  get: asyncHandler<{ id: string }>(async (req, res) => {
    const app = await appService.getById(ownerId(req), req.params.id);
    res.json({ ok: true, data: app });
  }),

  update: asyncHandler<{ id: string }, unknown, UpdateAppInput>(async (req, res) => {
    const app = await appService.update(ownerId(req), req.params.id, req.body);
    res.json({ ok: true, data: app });
  }),

  remove: asyncHandler<{ id: string }>(async (req, res) => {
    await appService.delete(ownerId(req), req.params.id);
    res.status(204).end();
  }),

  getConfig: asyncHandler<{ id: string }>(async (req, res) => {
    const { config } = await appService.getActiveConfig(ownerId(req), req.params.id);
    res.json({ ok: true, data: config });
  }),

  publishConfig: asyncHandler<{ id: string }, unknown, PublishAppConfigInput>(async (req, res) => {
    const result = await appService.publishConfig(
      ownerId(req),
      req.params.id,
      req.body.config,
      req.body.notes,
    );
    res.json({ ok: true, data: result });
  }),
};
