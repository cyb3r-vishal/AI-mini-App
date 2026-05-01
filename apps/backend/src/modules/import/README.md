# CSV Import

Config-driven, two-phase CSV bulk import.

## 🌐 Routes

Mounted nested under `appRouter` (auth-protected, tenant-scoped).

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| POST   | `/apps/:id/entities/:entity/import`               | Upload CSV → returns `ImportPreview`                |
| POST   | `/apps/:id/entities/:entity/import/commit`        | Validate + insert using a mapping                   |

## 🔀 Flow

```
 ┌────────────────────────────────────────────────────────────────┐
 │ 1. UPLOAD                                                      │
 │    multipart/form-data, field name="file", max 20 MB           │
 │         │                                                      │
 │         ▼                                                      │
 │    parseCsv(buffer)  — RFC 4180, LF/CRLF/CR, BOM, auto-delim   │
 │         │                                                      │
 │         ▼                                                      │
 │    cache[uploadId] = { rows, columns }  (in-memory, 15-min TTL)│
 │         │                                                      │
 │         ▼                                                      │
 │    return ImportPreview {                                      │
 │      columns, sampleRows (20), rowCount,                       │
 │      suggestedMapping,           ← fuzzy match by name/label   │
 │      warnings                    ← duplicate headers, etc.     │
 │    }                                                           │
 └────────────────────────────────────────────────────────────────┘
                  │
                  ▼
 ┌────────────────────────────────────────────────────────────────┐
 │ 2. COMMIT                                                      │
 │    body: { uploadId, mapping, skipInvalid }                    │
 │         │                                                      │
 │         ▼                                                      │
 │    for each row:                                               │
 │       coerce(str) per field type (number, bool, date, select,  │
 │                 multiselect, relation, json)                   │
 │       applyDefaults(entity, payload)                           │
 │       buildCreateSchema(entity).safeParse(payload)             │
 │           ├─ ok   → add to batch                               │
 │           └─ fail → collect {rowNumber, fieldErrors, message}  │
 │                                                                │
 │    if !skipInvalid and errors.length > 0 → 0 inserted          │
 │    else → prisma.record.createMany(batches of 500)             │
 │                                                                │
 │    return ImportCommitResult { inserted, skipped, errors }     │
 └────────────────────────────────────────────────────────────────┘
```

## 🛡️ Safety rails

| Concern                          | Behavior                                               |
| -------------------------------- | ------------------------------------------------------ |
| Wrong file type                  | multer `fileFilter` rejects non-CSV silently           |
| File > 20 MB                     | multer → `UPLOAD_LIMIT_FILE_SIZE` (400)                |
| CSV parse issues (dupes, quotes) | Non-fatal → surface in `preview.warnings`              |
| Unmapped CSV column              | Dropped silently                                       |
| Mapping → unknown field          | Dropped silently                                       |
| Unknown/invalid row value        | Per-row error; skipped if `skipInvalid=true`           |
| File exceeds `IMPORT_ROW_LIMIT`  | Truncated with warning (default 10,000)                |
| Cross-tenant access              | `ownerId` check on preview + commit                    |
| Expired `uploadId`               | 404 "Upload expired — please re-upload."               |
| Entity removed after preview     | 404 "Entity no longer exists"                          |

## 🧠 Type coercion per field

| Field type        | CSV string → stored value                                           |
| ----------------- | ------------------------------------------------------------------- |
| `string/text/email/url/date/datetime` | trimmed string (Zod then validates format)          |
| `number`          | `Number(s)` or left as string for Zod to reject                     |
| `boolean`         | `true/yes/1/y` → true · `false/no/0/n` → false                      |
| `select`          | match against `options[*].value` (preserves number/boolean values)  |
| `multiselect`     | split on `,` `;` `|`, then match options                            |
| `relation` (one)  | trimmed string id                                                   |
| `relation` (many) | split on `,` `;` `|` → array of ids                                 |
| `json`            | `JSON.parse` or literal                                             |
| blank cell        | `undefined` → `applyDefaults` fills in, or field becomes missing    |

## 📦 Storage

Uploads live in a per-process `Map` with a 15-minute TTL (`uploads` in
`import.service.ts`). Suitable for single-instance deploys. For
horizontal scaling, swap for:

- Redis (with the same key shape), or
- Object storage (S3/GCS) + a small metadata DB row.

The commit step is the only transactional piece — re-run of a commit with
the same `uploadId` is naturally idempotent **per request** (the cache is
cleared on success).

## 🧪 Quick cURL

```bash
# 1. Upload
curl -X POST http://localhost:4000/apps/$APP/entities/customer/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@customers.csv"

# 2. Commit
curl -X POST http://localhost:4000/apps/$APP/entities/customer/import/commit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uploadId":"...","mapping":{"Full Name":"name","Email":"email"},"skipInvalid":true}'
```
