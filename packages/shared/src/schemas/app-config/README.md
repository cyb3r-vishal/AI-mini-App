# AppConfig — Schema & Normalization

The JSON contract that drives the runtime generator. Built with **Zod** for a
single source of truth shared between frontend and backend.

## 📂 Layout

```
app-config/
├── primitives.ts   # IdSchema, HexColorSchema, LabelSchema, IconSchema
├── theme.ts        # ThemeSchema + ThemeMode
├── auth.ts         # AuthSettingsSchema (per-app runtime auth)
├── entity.ts       # FieldSchema (discriminated union) + EntitySchema
├── page.ts         # FormPage / TablePage / DashboardPage + Widget union
├── config.ts       # Root AppConfigSchema
├── normalize.ts    # Fault-tolerant pipeline: normalizeAppConfig() / validateAppConfig()
└── index.ts        # barrel
```

## 🧩 What the config describes

```ts
AppConfig = {
  schemaVersion: 1,
  id, name, description?, version,
  theme:    { mode, primaryColor, accentColor, backgroundColor, textColor, fontFamily, borderRadius },
  auth:     { enabled, allowSignup, requireEmailVerification, providers[], sessionDurationMinutes },
  entities: Entity[],   // each with fields[] (13 field types, discriminated)
  pages:    Page[],     // form | table | dashboard
  features: Record<string, boolean>,
  metadata: Record<string, unknown>,
}
```

### Field types (13)

`string`, `text`, `email`, `url`, `number`, `boolean`, `date`, `datetime`,
`select`, `multiselect`, `relation`, `json`. Each is its own Zod object in a
discriminated union on `type`.

### Page types (3 + widgets)

- `form` — entity-scoped form, layout + submit action.
- `table` — entity-scoped table, columns, pagination, search, actions.
- `dashboard` — grid of widgets: `metric`, `chart`, `list`, `markdown`.

## 🛡️ Fault-tolerant normalization

The system never crashes on bad config. Use:

```ts
import { normalizeAppConfig } from '@ai-gen/shared';

const { ok, config, issues } = normalizeAppConfig(maybeBadInput);
```

### Pipeline

```
input (unknown)
  ├─ Stage 1 — coerce root (must be an object; else fabricate skeleton)
  ├─ Stage 2 — clean entities
  │     • drop fields with unknown `type`
  │     • drop fields that fail Zod
  │     • dedup field keys inside each entity
  │     • dedup entity keys
  ├─ Stage 3 — clean pages
  │     • drop pages with unknown `type`
  │     • for dashboards: drop widgets with unknown `type`
  │     • dedup page keys
  ├─ Stage 4 — cross-reference
  │     • relation fields → must point at an existing entity
  │     • page.entity → must exist
  │     • widget.entity → must exist (markdown exempt)
  └─ Stage 5 — final strict parse; fall back to a safe skeleton if it still fails
```

### Every issue is reported

```ts
interface NormalizeIssue {
  path: string;     // "pages[1].type"
  code: string;     // "UNKNOWN_PAGE_TYPE"
  message: string;  // human-readable
}
```

Issue codes include:
`ROOT_NOT_OBJECT`, `MISSING_ID`, `MISSING_NAME`,
`ENTITIES_NOT_ARRAY`, `ENTITY_NOT_OBJECT`, `FIELD_NOT_OBJECT`,
`UNKNOWN_FIELD_TYPE`, `INVALID_FIELD`, `DUPLICATE_KEY`,
`PAGES_NOT_ARRAY`, `PAGE_NOT_OBJECT`, `UNKNOWN_PAGE_TYPE`, `INVALID_PAGE`,
`WIDGET_NOT_OBJECT`, `UNKNOWN_WIDGET_TYPE`, `INVALID_WIDGET`,
`UNKNOWN_RELATION_TARGET`, `UNKNOWN_PAGE_ENTITY`, `UNKNOWN_WIDGET_ENTITY`,
`ZOD_*` (residual strict-parse errors).

### Defaults built in

Many fields use Zod `.default(...)` — missing values are auto-filled:

| Path                        | Default                              |
| --------------------------- | ------------------------------------ |
| `schemaVersion`             | `1`                                  |
| `version`                   | `"0.0.1"`                            |
| `theme.mode`                | `"light"`                            |
| `theme.primaryColor`        | `"#1e293b"`                          |
| `theme.accentColor`         | `"#6366f1"`                          |
| `theme.fontFamily`          | `"Inter, system-ui, sans-serif"`     |
| `auth.enabled`              | `true`                               |
| `auth.providers`            | `["email"]`                          |
| `auth.sessionDurationMinutes` | `1440`                             |
| `field.required`            | `false`                              |
| `page.requireAuth`          | `false`                              |
| `table.pageSize`            | `25`                                 |
| `table.actions`             | `["create","edit","delete"]`         |
| `dashboard.widget.span`     | `4`                                  |

Many enums use Zod `.catch(...)` — invalid values fall back to the default
(e.g. `theme.mode: "neon"` → `"light"`).

### Two entry points

- `normalizeAppConfig(input)` — auto-fixes, collects issues, never throws.
  Use in ingestion paths, migrations, and when rendering the runtime.
- `validateAppConfig(input)` — strict pass/fail (returns `ZodError`).
  Use in the editor when you want to surface exact mistakes without mutation.

## 🌐 API endpoint

```
POST /config/normalize
Content-Type: application/json

<any JSON>
```

Returns:

```json
{
  "ok": true,
  "data": {
    "ok": false,
    "config": { /* normalized AppConfig */ },
    "issues": [ { "path": "...", "code": "...", "message": "..." } ]
  }
}
```

The HTTP response is **always 200** — the endpoint is guaranteed not to fail
on a bad payload. The inner `data.ok` tells you whether any issues were
reported.

## 📎 Examples

See `packages/shared/examples/`:

- `app-config.example.json` — valid CRM config.
- `app-config.broken.json` — deliberately malformed; exercise the pipeline.
