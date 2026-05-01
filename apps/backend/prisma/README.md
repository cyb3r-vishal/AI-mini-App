# Database — Prisma + PostgreSQL

Config-driven, multi-tenant schema for the AI App Generator.

## 🧭 Relationship map

```
User (tenant root)
 └── Session               (auth)
 └── App                   (tenant-scoped, unique slug per owner)
      ├── AppConfig        (versioned JSONB config, 1 active per app)
      └── Entity           (metadata "table" definitions)
           └── Record      (dynamic rows, JSONB payload)
```

- `User → Apps` — 1-to-many, cascade delete.
- `App → AppConfig` — 1-to-many, versioned; `@@unique([appId, version])` + partial unique index guarantees **one active config per app**.
- `App → Entity` — 1-to-many; unique `(appId, key)` = no duplicate entities per app.
- `Entity → Record` — 1-to-many; `Record.data` is JSONB for flexible schema.
- `Record` denormalizes `appId` and `ownerId` so tenant-scoped queries don't need joins.

## 🗝️ Multi-tenancy

- The **owner** of an `App` is the tenant boundary.
- Every query path ultimately filters by `ownerId` (on `App`) or the denormalized `Record.ownerId` / `Record.appId`.
- `onDelete: Cascade` from `User` → `App` → `Entity` → `Record` keeps tenant data contained.

## 🚀 Performance

### B-tree indexes (declarative in `schema.prisma`)

| Table         | Index                                                  | Purpose                                   |
| ------------- | ------------------------------------------------------ | ----------------------------------------- |
| `users`       | `email`, `created_at`                                  | Login lookup, admin listing               |
| `sessions`    | `user_id`, `expires_at`, `token_hash`                  | Session lookup + cleanup sweeps           |
| `apps`        | `owner_id`, `status`, `(owner_id, status)`             | Dashboard list / filter                   |
| `app_configs` | `(app_id, version)` unique, `(app_id, is_active)`      | Load active config                        |
| `entities`    | `(app_id, key)` unique                                 | Resolve entity by key                     |
| `records`     | `entity_id`, `app_id`, `owner_id`, composite + soft-delete | Tenant queries, recency sorts         |

### JSONB / GIN indexes (added via raw SQL in the migration)

Prisma does not yet support declaring GIN indexes. They live in the initial migration:

| Table         | Index                          | Use                                                |
| ------------- | ------------------------------ | -------------------------------------------------- |
| `app_configs` | `GIN (config jsonb_path_ops)`  | Config introspection: `config @> '{...}'`          |
| `entities`    | `GIN (schema jsonb_path_ops)`  | Find entities whose schema contains given fields   |
| `records`     | `GIN (data jsonb_path_ops)`    | Primary JSONB filter: `data @> '{"status":"open"}'`|

### Partial indexes

- `app_configs_app_id_active_unique` — enforces at most one active config per app.
- `records_entity_live_idx` — skips soft-deleted rows, ordered by `updated_at DESC`.

### Why `jsonb_path_ops`?

Smaller and faster than the default `jsonb_ops` when queries are limited to containment operators (`@>`), which is the intended primary access pattern.

## 🛠️ Commands (run from `apps/backend`)

```bash
pnpm db:generate          # generate Prisma client
pnpm db:migrate           # create + apply a migration in dev
pnpm db:migrate:deploy    # apply existing migrations in prod
pnpm db:migrate:reset     # nuke DB + re-run migrations + seed
pnpm db:push              # push schema without migration (prototyping only)
pnpm db:studio            # open Prisma Studio
pnpm db:seed              # run seed script
pnpm db:format            # format schema.prisma
```

## 🧱 Migration file

The initial migration lives at:

```
prisma/migrations/20260430000000_init/migration.sql
```

It covers: all tables, enums, FKs, B-tree indexes, **three GIN indexes**, and the two partial indexes.

## 🧪 Example JSONB queries (future use)

```sql
-- Records where data contains a specific status
SELECT * FROM records
WHERE entity_id = $1
  AND is_deleted = false
  AND data @> '{"status":"open"}';

-- Load the active config for an app
SELECT config FROM app_configs
WHERE app_id = $1 AND is_active = true
LIMIT 1;
```
