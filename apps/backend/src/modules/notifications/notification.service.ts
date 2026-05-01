import type { Prisma, Notification as PrismaNotification } from '@prisma/client';
import type {
  Notification,
  NotificationListQuery,
  NotificationListResult,
  NotificationType,
} from '@ai-gen/shared';
import { prisma } from '../../db/prisma.js';

function serialize(n: PrismaNotification): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    meta: (n.meta ?? {}) as Record<string, unknown>,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  meta?: Record<string, unknown>;
}

export const notificationService = {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const created = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        meta: (input.meta ?? {}) as Prisma.InputJsonValue,
      },
    });
    return serialize(created);
  },

  async list(userId: string, query: NotificationListQuery): Promise<NotificationListResult> {
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.filter === 'unread') where.readAt = null;

    const skip = (query.page - 1) * query.pageSize;

    const [items, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items: items.map(serialize),
      total,
      unreadCount,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, readAt: null } });
  },

  /** Mark specific ids, or all unread when `ids` is omitted. Returns rows affected. */
  async markRead(userId: string, ids?: string[]): Promise<number> {
    const where: Prisma.NotificationWhereInput = { userId, readAt: null };
    if (ids && ids.length > 0) where.id = { in: ids };
    const result = await prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });
    return result.count;
  },

  async remove(userId: string, id: string): Promise<void> {
    await prisma.notification.deleteMany({ where: { id, userId } });
  },
};
