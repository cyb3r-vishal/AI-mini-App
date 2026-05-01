import { EventEmitter } from 'node:events';

/**
 * =============================================================================
 * Typed event bus
 * =============================================================================
 * A thin wrapper over Node's EventEmitter with strict types. Handlers are
 * called asynchronously (next microtask) and their errors never propagate to
 * the caller that emitted the event — so emitting is fire-and-forget.
 *
 * Swap for Redis / pg-notify / BullMQ later without touching call sites.
 */

export interface RecordCreatedPayload {
  ownerId: string;
  appId: string;
  appName: string;
  entityKey: string;
  entityName: string;
  recordId: string;
  data: Record<string, unknown>;
  actor: { userId: string; email: string };
}

export interface RecordUpdatedPayload extends RecordCreatedPayload {
  previousData: Record<string, unknown>;
}

export interface RecordDeletedPayload {
  ownerId: string;
  appId: string;
  appName: string;
  entityKey: string;
  entityName: string;
  recordId: string;
  actor: { userId: string; email: string };
}

export interface SystemEventPayload {
  ownerId: string;
  title: string;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface AppEvents {
  'record.created': RecordCreatedPayload;
  'record.updated': RecordUpdatedPayload;
  'record.deleted': RecordDeletedPayload;
  system: SystemEventPayload;
}

export type AppEventName = keyof AppEvents;

class TypedBus {
  private readonly emitter = new EventEmitter({ captureRejections: true });

  constructor() {
    this.emitter.setMaxListeners(64);
    this.emitter.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[event-bus] handler error:', err);
    });
  }

  on<E extends AppEventName>(
    event: E,
    handler: (payload: AppEvents[E]) => Promise<void> | void,
  ): () => void {
    const wrapped = (payload: AppEvents[E]) => {
      // Isolate handler failures so one broken handler can't break others.
      Promise.resolve()
        .then(() => handler(payload))
        .catch((err) => this.emitter.emit('error', err));
    };
    this.emitter.on(event, wrapped);
    return () => this.emitter.off(event, wrapped);
  }

  emit<E extends AppEventName>(event: E, payload: AppEvents[E]): void {
    // Run on next microtask so the caller's response isn't blocked.
    queueMicrotask(() => this.emitter.emit(event, payload));
  }
}

export const eventBus = new TypedBus();
