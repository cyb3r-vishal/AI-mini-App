# Dynamic CRUD Engine

A generic, config-driven record API. **Zero entity hardcoding.**

## 🌐 Routes

All routes require auth. User-scoping is enforced in the service layer.

### Apps

| Method | Path                          | Purpose                                    |
| ------ | ----------------------------- | ------------------------------------------ |
| POST   | `/apps`                       | Create app (optional initial config)       |
| GET    | `/apps`                       | List user's apps                           |
| GET    | `/apps/:id`                   | Get single app                             |
| PATCH  | `/apps/:id`                   | Update name/description/status             |
| DELETE | `/apps/:id`                   | Delete app (cascades to entities/records)  |
| GET    | `/apps/:id/config`            | Get active AppConfig                       |
| POST   | `/apps/:id/config`            | Publish a new config version               |

### Records (dynamic per entity)

| Method | Path                                                 |
| ------ | ---------------------------------------------------- |
| POST   | `/apps/:id/entities/:entity/records`                 |
| GET    | `/apps/:id/entities/:entity/records`                 |
| GET    | `/apps/:id/entities/:entity/records/:recordId`       |
| PUT    | `/apps/:id/entities/:entity/records/:recordId`       |
| DELETE | `/apps/:id/entities/:entity/records/:recordId`       |

## 🧠 How it works

```
request
  ↓
resolveContext(ownerId, appId, entityKey)
  ├─ load App by (id, ownerId)        → tenant guard
  ├─ load active AppConfig            → source of truth
  ├─ find entity in config.entities   → or 404
  └─ find Entity row in DB            → join key for records
  ↓
buildCreateSchema(entity) / buildUpdateSchema(entity)
  ↓
zod .safeParse(payload)   → 400 on failure (field-level errors)
  ↓
applyDefaults(entity, data)
verifyRelations()                     → 400 if target record missing
uniqueness check (per field.unique)   → 409 on clash
  ↓
prisma.record.{create|update|findMany|...}
  ↓
serialize → 200/201 JSON
```

- **Validation** is generated per request from the entity definition. Every
  field type (`string`, `number`, `email`, `relation`, `select`, ...) has a
  branch in `record-schema.builder.ts`. Add a new field type to the shared
  schema → handle the branch here → done.
- **Tenant isolation** is layered: the `App` is loaded by `(id, ownerId)`
  before touching records, and queries filter `records.ownerId` as
  defense-in-depth.
- **Storage** uses JSONB. No per-entity tables. A single GIN index
  (`records.data`) powers containment queries.
- **Relations** store ids. The engine verifies referenced records exist in
  the same app before insert/update.
- **Uniqueness** declared in config (`field.unique: true`) is enforced at
  the service level via JSON path queries.
- **Soft delete** flips `isDeleted=true` — preserved in JSONB, excluded via
  the `records_entity_live_idx` partial index.

## 🔎 Listing records

```
GET /apps/:id/entities/:entity/records
  ?page=1
  &pageSize=25
  &sort=createdAt:desc
  &filter={"status":"open"}
  &q=jane
```

- `filter` — JSON object. Each top-level key becomes a JSONB path-equality
  filter, e.g. `data->'status' = 'open'`. Fast on the GIN index.
- `q` — free-text search across string-ish fields declared in the entity
  schema (string / text / email / url).
- `sort` — `createdAt:desc` | `updatedAt:asc` (native columns only for
  stable performance).

## 🔐 Safety rails

| Concern                     | Handling                                                |
| --------------------------- | ------------------------------------------------------- |
| Unknown entity key          | 404, never crashes                                      |
| Unknown field in payload    | `.strip()` — silently discarded                         |
| Malformed `filter` JSON     | 400 with a clear message                                |
| Relation to missing record  | 400 with field-level pointer                            |
| Cross-tenant access         | Service-level `(id, ownerId)` guard everywhere          |
| Broken stored config        | `normalizeAppConfig()` re-runs on load; never crashes   |
| Config mutation race        | `publishConfig` is wrapped in a single DB transaction   |

## 📎 Example flow

```bash
# 1. Create the app with a config that has a "customer" entity.
POST /apps
{ "slug":"crm","name":"CRM","config":{ ...AppConfig... } }

# 2. Create a record — schema comes from the active config.
POST /apps/<id>/entities/customer/records
{ "name":"Jane","email":"jane@acme.test","status":"lead" }

# 3. List with JSONB filter.
GET /apps/<id>/entities/customer/records?filter={"status":"lead"}

# 4. Publish a new config version — entities auto-synced.
POST /apps/<id>/config
{ "config": { ...new AppConfig... }, "notes":"Added 'notes' field" }
```
