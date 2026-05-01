# AI App Generator

> JSON in, a full working app out. A config-driven app generator — like Base44, built from scratch.

Ship a JSON config → the runtime dynamically generates the UI (forms, tables,
dashboards), the backend CRUD APIs, the database shape, and the auth-scoped
data boundaries. **Zero code per app.** Feed it malformed configs, unknown
component types, missing fields, or dangling references — it refuses to break.

---

## 🧠 What it does

| Input                                     | Output                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `POST /apps` with an AppConfig JSON blob  | A runnable app at `/apps/<id>` — nav, pages, forms, tables, dashboards |
| User interacts with a form                | `POST /apps/<id>/entities/<entity>/records` auto-validates and persists |
| Config missing a field / has a bad type   | Normalizer drops the offender, records a warning, keeps going          |
| You republish with a new version          | Records preserved, entities reconciled, UI updates — no migration      |

A tiny AppConfig example lives at [`packages/shared/examples/app-config.example.json`](packages/shared/examples/app-config.example.json).
A deliberately-broken one lives next to it as `app-config.broken.json` — feed
it to the runtime and watch the system stay up.

---

## 🏗️ Stack

| Layer            | Tech                                                                |
| ---------------- | ------------------------------------------------------------------- |
| Monorepo         | **pnpm workspaces** + **Turborepo**                                 |
| Frontend         | **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**     |
| Backend          | **Node.js** · **Express** · **TypeScript** · ESM                    |
| Database         | **PostgreSQL** + **Prisma** (JSONB + GIN indexes, soft-delete)      |
| Shared contracts | **Zod** schemas with a fault-tolerant normalizer                    |
| Auth             | JWT access + httpOnly refresh cookie, bcrypt, DB-backed sessions    |
| Runtime registry | Map-based field / cell / widget / page dispatch with fallbacks      |
| Eventing         | In-process event bus → notifications + mock transactional email    |
| Deployment       | Dockerfile per app · docker-compose · Vercel / Render / Railway     |

---

## 🔑 Features vs. the brief

### Core (all required) ✅

- [x] **Dynamic application runtime** — one codebase, any app shape from JSON
- [x] **Frontend** — Next.js 14, renders UI dynamically; loading, error, and fallback states for every unknown type
- [x] **Backend** — Node/TS; CRUD APIs generated per entity, validated with a Zod schema built from the config at request time
- [x] **Database** — PostgreSQL; JSONB + GIN for record payloads, soft-delete, tenant-scoped denormalized columns
- [x] **Auth** — email/password, JWT access + refresh, sessions, role guards; every record op is user-scoped
- [x] **Extensibility** — `fieldRegistry.register('rating', MyField)` is the entire API; zero core code touched

### Feature set (pick 3, we implemented 4) ✅

1. **CSV Import System** — upload → preview (header + suggested mapping) → commit; per-row coercion + per-row Zod validation with `skipInvalid` mode. See `apps/backend/src/modules/import/`.
2. **Event-based Notifications** — in-process event bus fires on `record.created|updated|deleted`; a handler persists a `Notification` row and triggers a (mock) transactional email. Bell UI reads unread count in real time via polling. See `apps/backend/src/events/` and `apps/backend/src/modules/notifications/`.
3. **Post-creation integrations / config versioning** — every `POST /apps/:id/config` creates a new `AppConfig` version, deactivates the previous, and reconciles the `Entity` table. Records survive schema changes because payloads are JSONB.
4. **Mobile-ready / installable** — responsive shell (hamburger nav on mobile), viewport + theme-color meta, web manifest + SVG icon; installable as a PWA.

### Stretch

- [x] **Config-driven login/signup** — auth pages render from config; the shared `AuthSettings` schema accepts `providers`, `allowSignup`, session TTL, email-verification toggle.
- [x] **Reverse-engineered edge cases** — the normalizer (`packages/shared/src/schemas/app-config/normalize.ts`) has a 5-stage pipeline that handles: non-object root · non-array entities/pages · unknown field/page/widget types · duplicate keys · dangling relation targets · bad widget shapes. **Always returns an `AppConfig` + a list of issues, never throws.**

### Evaluation edges we explicitly handle

| Hostile input                                     | Behavior                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `{ "pages": "oops" }`                             | Dropped with a `PAGES_NOT_ARRAY` issue; rest of config still renders      |
| Page with unknown `type: "kanban"`                | Dropped with `UNKNOWN_PAGE_TYPE`; visible in normalization issues         |
| Field with unknown `type: "color"`                | Dropped from entity; if referenced in a form, form still renders the rest|
| Relation pointing at non-existent entity          | Field dropped with `UNKNOWN_RELATION_TARGET`; page/record still work      |
| Duplicate `entities[].key`                        | First wins, duplicate recorded with `DUPLICATE_KEY`                       |
| Component dispatched to a type no one registered  | Fallback `UnknownPage` / `UnknownField` / `UnknownWidget` — UI never whites out |

---

## 🧱 Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                       @ai-gen/shared                               │
│  Zod schemas + normalizer  (one source of truth, both sides)       │
└─────────┬───────────────────────────────────────┬──────────────────┘
          │                                       │
          ▼                                       ▼
┌──────────────────────────────┐     ┌────────────────────────────────┐
│   @ai-gen/backend (Express)  │     │  @ai-gen/frontend (Next.js)    │
│                              │     │                                │
│  /apps            CRUD       │     │  /apps           index         │
│  /apps/:id/config publish    │     │  /apps/:id       runner shell  │
│  /apps/:id/entities/:e/records│ ◀── │  /apps/:id/:pg   page runner   │
│                              │ JWT │                                │
│  ┌────────────────────────┐  │     │  ┌──────────────────────────┐  │
│  │ Dynamic CRUD engine    │  │     │  │ Registry (map-based)     │  │
│  │ Zod schemas built from │  │     │  │ field / cell / widget /  │  │
│  │ entity at request time │  │     │  │ page dispatch + fallback │  │
│  └────────────────────────┘  │     │  └──────────────────────────┘  │
│                              │     │                                │
│  Event bus → notifications   │     │  <DynamicForm /> / <Table />   │
└─────────┬────────────────────┘     └────────────────────────────────┘
          │
          ▼
┌──────────────────────────────┐
│  PostgreSQL (Prisma)         │
│  User · Session · App ·      │
│  AppConfig (versioned JSONB) │
│  Entity · Record (JSONB+GIN) │
│  Notification                │
└──────────────────────────────┘
```

### Request lifecycle — "create a record"

1. `POST /apps/:id/entities/:entity/records` → `requireAuth` → controller.
2. `recordService.resolveContext` loads the app + **active** AppConfig; tenant-checked (`ownerId`).
3. The service calls `buildCreateSchema(entity)` — a **Zod schema generated from the entity at runtime**, based on the `Field[]` list and their per-type constraints (`min`, `max`, `pattern`, `options`, `cardinality`, …).
4. Relations are resolved in-DB (target existence check, same-app scope).
5. Uniqueness is enforced per `unique: true` field using a JSONB-path query.
6. Insert → emit `record.created` → notification handler persists + emails.

Zero hardcoded entity logic.

### Extending

```ts
// Add a new field type — one line, anywhere in the app.
import { fieldRegistry } from '@/registry';
import { RatingField } from './RatingField';
fieldRegistry.register('rating', RatingField);

// Same pattern for widgets, cells, pages.
```

No switch-case exists in the render path. A new page type lives entirely in its own file.

---

## 🚀 Getting started

### Prerequisites

- Node.js **≥ 18.17** (recommended 20.x, see `.nvmrc`)
- **pnpm ≥ 9** (`npm i -g pnpm@9`)
- PostgreSQL **≥ 14** (or use the docker-compose target below)

### Local dev (native)

```bash
pnpm install

# Backend
cp apps/backend/.env.example apps/backend/.env
# → set DATABASE_URL, JWT_* secrets
cd apps/backend && pnpm db:migrate && cd ../..

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local

# Run everything
pnpm dev
#   frontend → http://localhost:3000
#   backend  → http://localhost:4000
```

### Local dev (Docker — zero setup)

```bash
docker compose up -d --build
# → http://localhost:3000
```

`docker-compose.yml` provisions Postgres, auto-runs Prisma migrations on boot,
and starts both apps. Tear down with `docker compose down -v` (the `-v` also
wipes the DB volume).

---

## 🧪 Try the end-to-end flow

1. `http://localhost:3000/signup` — create an account
2. `/apps` — hit **Create app** (the starter config is pre-filled)
3. You're dropped at `/apps/<id>/overview` — the runner
4. Switch to **Create task**, submit — you'll see a bell notification fire
5. Open **All tasks** — the row you just created is there, fully filterable
6. Go to `/import`, upload a CSV — watch the column-mapper suggest fields
7. Edit the JSON on `/apps` and republish — the runner hot-swaps pages

### Break it on purpose

In the **Create app** page, paste this into the JSON box:

```json
{
  "id": "chaos",
  "name": "Hostile config",
  "entities": "not-an-array",
  "pages": [
    { "key": "ok",  "type": "form",     "title": "OK",    "entity": "ghost", "submitLabel": "Go" },
    { "key": "bad", "type": "wizard",   "title": "Nope" },
    { "key": "dsh", "type": "dashboard","title": "Overview", "widgets": [
      { "key": "unicorn", "type": "unicorn", "title": "Unknown" }
    ] }
  ]
}
```

The app still loads. The bad page is gone. The unknown widget shows a
callout, not a white screen. All issues surface in the normalization log.

---

## 📤 Deployment

Full guide in [**DEPLOYMENT.md**](./DEPLOYMENT.md). Quick refs:

- **Docker Compose (any VPS):** `docker compose up -d --build`
- **Vercel (frontend) + Render/Railway (backend+Postgres):** step-by-step
- **Kubernetes:** Dockerfiles are standard multi-stage builds — drop into any orchestrator

Migrations are applied automatically at backend boot via `prisma migrate deploy`.

---

## 📁 Repo layout

```
ai-generator-app/
├── apps/
│   ├── backend/                  # Express + Prisma + Zod
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/       # incl. GIN index on records.data
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── apps/         # create / list / publish config
│   │       │   ├── auth/         # register / login / refresh / logout / me
│   │       │   ├── entities/     # entity-sync on config publish
│   │       │   ├── records/      # dynamic CRUD engine
│   │       │   ├── import/       # CSV preview + commit
│   │       │   └── notifications/# event handlers + mock email
│   │       ├── events/           # in-process pub/sub
│   │       ├── middleware/       # auth, validate, error, 404
│   │       └── types/            # ambient Request augmentations
│   │
│   └── frontend/                 # Next.js 14 App Router
│       ├── Dockerfile
│       └── src/
│           ├── app/
│           │   ├── apps/              # NEW: apps index
│           │   │   └── [id]/          # NEW: app runner shell
│           │   │       └── [pageKey]/ # NEW: config-driven page runner
│           │   ├── dashboard|forms|tables|import|notifications|registry|ui
│           │   ├── login|signup
│           │   └── layout.tsx         # PWA manifest + meta
│           ├── components/            # AppShell, DynamicForm, DynamicTable, CsvImport …
│           ├── registry/              # field / cell / widget / page maps
│           │   ├── fields/ cells/ widgets/ pages/
│           │   └── *Renderer.tsx      # host components (PageRenderer, FieldRenderer, CellRenderer)
│           ├── hooks/                 # use-dynamic-form, use-dynamic-records, use-notifications
│           ├── lib/                   # api-client, auth-context, token-storage
│           └── public/
│               ├── manifest.webmanifest
│               └── icon.svg
│
├── packages/
│   └── shared/                   # @ai-gen/shared
│       ├── examples/             # demo + deliberately-broken configs
│       └── src/
│           ├── schemas/
│           │   ├── app-config/   # primitives, theme, auth, entity, page, config
│           │   │   └── normalize.ts   # the fault-tolerant pipeline
│           │   ├── api.schema.ts
│           │   ├── auth.schema.ts
│           │   ├── import.schema.ts
│           │   └── notification.schema.ts
│           └── types/
│
├── docker-compose.yml
├── DEPLOYMENT.md
├── turbo.json · pnpm-workspace.yaml · tsconfig.base.json
└── package.json
```

---

## 📦 Workspace scripts

| Script           | What it does                          |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Run all apps in parallel (Turbo)      |
| `pnpm build`     | Build every package and app           |
| `pnpm typecheck` | Whole-repo `tsc --noEmit`             |
| `pnpm lint`      | ESLint everywhere                     |
| `pnpm format`    | Prettier write                        |
| `pnpm clean`     | Remove build artifacts + node_modules |

Backend-only: `pnpm --filter @ai-gen/backend db:migrate | db:seed | db:studio | db:generate | db:migrate:reset`.

---

## 🔭 What's next (not required by the brief)

- Internationalization (schema hooks in place; renderer wiring pending)
- GitHub export of the generated codebase (tar + push)
- Real email transport (Resend / SES) behind the current `EmailTransport` interface
- Vitest + Playwright — contracts and happy-path flows
- Live config editor with diff-based republish

---

## 📚 Further reading inside the repo

- `apps/backend/prisma/README.md` — DB relationships, JSONB strategy, GIN index
- `apps/backend/src/modules/import/README.md` — CSV import design
- `apps/backend/src/modules/notifications/README.md` — event bus contract
- `apps/backend/src/modules/records/README.md` — dynamic CRUD engine
- `apps/frontend/src/registry/README.md` — registry pattern, fallbacks, extension
- `apps/frontend/src/components/dynamic-form.README.md`
- `apps/frontend/src/components/dynamic-table.README.md`
- `packages/shared/src/schemas/README.md` — schema + normalizer design

---

_Built for the AI App Generator take-home (Track A — Systems Thinking)._
