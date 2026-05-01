import type { MarkReadInput, NotificationListQuery } from '@ai-gen/shared';
import { asyncHandler, type ParamsDictionary } from '../../utils/async-handler.js';
import { HttpError } from '../../utils/http-error.js';
import { notificationService } from './notification.service.js';

function userId(req: { auth?: { userId: string } }): string {
  if (!req.auth) throw HttpError.unauthorized();
  return req.auth.userId;
}

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const query = (req.validatedQuery ?? {}) as NotificationListQuery;
    const result = await notificationService.list(userId(req), query);
    res.json({ ok: true, data: result });
  }),

  unreadCount: asyncHandler(async (req, res) => {
    const count = await notificationService.unreadCount(userId(req));
    res.json({ ok: true, data: { unreadCount: count } });
  }),

  markRead: asyncHandler<ParamsDictionary, unknown, MarkReadInput>(async (req, res) => {
    const updated = await notificationService.markRead(userId(req), req.body.ids);
    res.json({ ok: true, data: { updated } });
  }),

  remove: asyncHandler<{ id: string }>(async (req, res) => {
    await notificationService.remove(userId(req), req.params.id);
    res.status(204).end();
  }),
};
