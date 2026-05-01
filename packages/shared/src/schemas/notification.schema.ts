import { z } from 'zod';

/**
 * Notification contracts — shared between frontend and backend.
 */

export const NotificationTypeSchema = z.enum([
  'RECORD_CREATED',
  'RECORD_UPDATED',
  'RECORD_DELETED',
  'SYSTEM',
]);

export const NotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string().nullable(),
  meta: z.record(z.string(), z.unknown()).default({}),
  readAt: z.string().nullable(), // ISO
  createdAt: z.string(),         // ISO
});

export const NotificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(1000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  /** 'unread' = readAt IS NULL. Omit for all. */
  filter: z.enum(['all', 'unread']).default('all'),
});

export const NotificationListResultSchema = z.object({
  items: z.array(NotificationSchema),
  total: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const MarkReadInputSchema = z.object({
  /** Omit `ids` to mark ALL unread as read. */
  ids: z.array(z.string().min(1)).optional(),
});

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
export type NotificationListResult = z.infer<typeof NotificationListResultSchema>;
export type MarkReadInput = z.infer<typeof MarkReadInputSchema>;
