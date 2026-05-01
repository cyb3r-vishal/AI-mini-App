# Notifications

Event-driven, per-user notification system. Integrates with the dynamic CRUD
engine via an in-process event bus.

## 🔀 Flow

```
POST /records              ┐
PUT  /records/:id          ├─ recordService.create/update/delete
DELETE /records/:id        │
                           │ emits (fire-and-forget, next microtask)
                           ▼
          eventBus.emit('record.created' | 'record.updated' | 'record.deleted')
                           │
                           ▼
      notification.handlers.ts
          ├─ notificationService.create({...})       → DB row
          └─ emailTransport.send({to, subject, body}) → console (mock)
                           │
                           ▼
      User's bell polls /notifications (every 30s, visibility-aware)
```

## 🗄️ Data model

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String                                   // recipient
  type      NotificationType                         // RECORD_CREATED | _UPDATED | _DELETED | SYSTEM
  title     String
  message   String?
  meta      Json             @db.JsonB               // { appId, entityKey, recordId, actorId, ... }
  readAt    DateTime?
  createdAt DateTime         @default(now())
}
```

Indexes:

- `(user_id)`, `(user_id, read_at)`, `(user_id, created_at)` B-tree.
- **Partial** `(user_id, created_at DESC) WHERE read_at IS NULL` — powers fast
  unread-count queries.

## 🌐 Routes (all auth-protected)

| Method | Path                               | Purpose                          |
| ------ | ---------------------------------- | -------------------------------- |
| GET    | `/notifications?filter=unread`     | Paginated list                   |
| GET    | `/notifications/unread-count`      | Badge count                      |
| POST   | `/notifications/mark-read`         | Body: `{ ids?: string[] }`. Omit ids = mark all |
| DELETE | `/notifications/:id`               | Dismiss a single notification    |

## 🚌 Event bus

`src/events/event-bus.ts` — a typed wrapper over Node's `EventEmitter` with:

- **Typed payloads** (`AppEvents` map).
- **Fire-and-forget** — `emit` uses `queueMicrotask` so API handlers aren't
  blocked by listeners.
- **Handler isolation** — each listener's rejection is caught and surfaced
  on the bus's `error` channel; one broken handler won't break others.
- **Swap-ready** — replace internals with Redis/pg-notify/BullMQ without
  changing call sites.

Events emitted by the record service:

```ts
eventBus.emit('record.created', { ownerId, appId, appName, entityKey,
                                   entityName, recordId, data, actor });
eventBus.emit('record.updated', { ...same..., previousData });
eventBus.emit('record.deleted', { ownerId, appId, appName, entityKey,
                                   entityName, recordId, actor });
```

## 📧 Mock email

`email.service.ts` exports an `EmailTransport` interface. The default
implementation logs to stdout:

```
📧 [mock-email] to=jane@acme.test
    subject: [CRM] New Customer
    alice@acme.test created a new Customer (Jane Doe).
```

Swap for SES / Resend / SMTP by implementing `EmailTransport.send(msg)` and
replacing the exported `emailTransport`. No other code changes.

The handlers **do not** email the owner for their own actions (prevents
self-spam).

## 🧠 Smart titles

Notification titles summarise the record using the first non-empty value
among `title`, `name`, `label`, `subject`, `email` — so a Customer record
with `{ name: "Jane Doe" }` becomes "New Customer: Jane Doe".

## 🔐 Multi-tenancy

- `User → Notification` is 1-to-many with `onDelete: Cascade`.
- All reads/writes scope by `userId` (from `req.auth.userId`).
- No cross-tenant leakage possible from the API surface.

## 🧪 Try it

```bash
# 1. Run the migration
cd apps/backend && pnpm db:migrate

# 2. Start backend + frontend, sign in.
# 3. From another session / curl, create a record on one of your apps:
curl -X POST http://localhost:4000/apps/$APP/entities/customer/records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@acme.test"}'

# 4. Watch the dashboard — the bell's badge updates within 30 s.
# 5. Open http://localhost:3000/notifications for the full list.
```

## 🚀 Extending

Add a new notification trigger in 3 steps:

1. Declare the event in `AppEvents` (`event-bus.ts`).
2. Emit it from wherever it happens.
3. Register a handler in `notification.handlers.ts` that calls
   `notificationService.create(...)`.

Because notifications are persisted generically (`type`, `title`, `message`,
`meta`), no UI changes are required for new event types.
