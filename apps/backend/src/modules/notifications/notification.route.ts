import { Router } from 'express';
import { MarkReadInputSchema, NotificationListQuerySchema } from '@ai-gen/shared';
import { requireAuth } from '../../middleware/require-auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { notificationController } from './notification.controller.js';

export const notificationRouter: import('express').Router = Router();

notificationRouter.use(requireAuth);

notificationRouter.get(
  '/',
  validateQuery(NotificationListQuerySchema),
  notificationController.list,
);
notificationRouter.get('/unread-count', notificationController.unreadCount);
notificationRouter.post(
  '/mark-read',
  validateBody(MarkReadInputSchema),
  notificationController.markRead,
);
notificationRouter.delete('/:id', notificationController.remove);
