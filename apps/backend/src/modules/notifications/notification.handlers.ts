import { prisma } from '../../db/prisma.js';
import { eventBus, type RecordCreatedPayload, type RecordDeletedPayload, type RecordUpdatedPayload } from '../../events/event-bus.js';
import { emailTransport } from './email.service.js';
import { notificationService } from './notification.service.js';

/**
 * Wires the notification service to the event bus.
 * Call `registerNotificationHandlers()` once at app boot.
 *
 * Design:
 *   - Persist a row for the app owner (who will see it in the UI).
 *   - If the owner has an email, fire a mock email.
 *   - Handlers are idempotent-friendly: failures inside them never break the
 *     original write (event emission is fire-and-forget).
 */

async function emailOwnerIfPossible(ownerId: string, subject: string, body: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { email: true },
  });
  if (!user?.email) return;
  await emailTransport.send({ to: user.email, subject, body });
}

function summarize(entityName: string, data: Record<string, unknown>): string {
  // Pick a short human-readable title from the record data.
  const candidates = ['title', 'name', 'label', 'subject', 'email'];
  for (const k of candidates) {
    const v = data[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return entityName;
}

async function handleRecordCreated(p: RecordCreatedPayload): Promise<void> {
  const label = summarize(p.entityName, p.data);
  await notificationService.create({
    userId: p.ownerId,
    type: 'RECORD_CREATED',
    title: `New ${p.entityName}: ${label}`,
    message: `Created in ${p.appName}`,
    meta: {
      appId: p.appId,
      entityKey: p.entityKey,
      recordId: p.recordId,
      actorId: p.actor.userId,
    },
  });

  // Only email when the actor is not the owner (don't nag yourself).
  if (p.actor.userId !== p.ownerId) {
    await emailOwnerIfPossible(
      p.ownerId,
      `[${p.appName}] New ${p.entityName}`,
      `${p.actor.email} created a new ${p.entityName} (${label}).`,
    );
  }
}

async function handleRecordUpdated(p: RecordUpdatedPayload): Promise<void> {
  const label = summarize(p.entityName, p.data);
  await notificationService.create({
    userId: p.ownerId,
    type: 'RECORD_UPDATED',
    title: `Updated ${p.entityName}: ${label}`,
    message: `Edited in ${p.appName}`,
    meta: {
      appId: p.appId,
      entityKey: p.entityKey,
      recordId: p.recordId,
      actorId: p.actor.userId,
      changedKeys: diffKeys(p.previousData, p.data),
    },
  });

  if (p.actor.userId !== p.ownerId) {
    await emailOwnerIfPossible(
      p.ownerId,
      `[${p.appName}] ${p.entityName} updated`,
      `${p.actor.email} updated ${p.entityName} (${label}).`,
    );
  }
}

async function handleRecordDeleted(p: RecordDeletedPayload): Promise<void> {
  await notificationService.create({
    userId: p.ownerId,
    type: 'RECORD_DELETED',
    title: `Deleted a ${p.entityName}`,
    message: `Removed from ${p.appName}`,
    meta: {
      appId: p.appId,
      entityKey: p.entityKey,
      recordId: p.recordId,
      actorId: p.actor.userId,
    },
  });
}

function diffKeys(prev: Record<string, unknown>, next: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changed: string[] = [];
  for (const k of keys) {
    if (JSON.stringify(prev[k]) !== JSON.stringify(next[k])) changed.push(k);
  }
  return changed;
}

let registered = false;

export function registerNotificationHandlers(): void {
  if (registered) return;
  registered = true;

  eventBus.on('record.created', handleRecordCreated);
  eventBus.on('record.updated', handleRecordUpdated);
  eventBus.on('record.deleted', handleRecordDeleted);
}
