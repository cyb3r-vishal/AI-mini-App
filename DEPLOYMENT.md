# 🚀 Deployment Guide

Three supported paths, ordered from zero-ops to most customizable:

| Option                          | Effort    | Best for                                   |
| ------------------------------- | --------- | ------------------------------------------ |
| **A. Vercel + Render/Railway**  | ~5 min    | Judges / demo URL                          |
| **B. Docker Compose (any VPS)** | ~10 min   | Self-hosted, single host                   |
| **C. Kubernetes / multi-node**  | advanced  | Real production (not covered here)         |

End state: one public URL for the frontend, one for the backend, PostgreSQL managed.

---

## A. Vercel (frontend) + Render or Railway (backend + Postgres)

### A.1 — Provision Postgres

**Render:** Dashboard → _New_ → _PostgreSQL_ → pick region → _Create_.
Copy the **External Database URL**.

**Railway:** _New Project_ → _Add PostgreSQL_ → _Variables_ tab → copy `DATABASE_URL`.

(Neon / Supabase / Fly Postgres all work identically.)

### A.2 — Deploy the backend

**Render (recommended):**

1. _New_ → _Web Service_ → connect the repo.
2. **Root Directory:** `apps/backend`
3. **Build Command:**
   ```bash
   corepack enable && pnpm install --frozen-lockfile && pnpm --filter @ai-gen/backend build && pnpm --filter @ai-gen/backend exec prisma migrate deploy
   ```
4. **Start Command:** `node dist/server.js`
5. **Environment variables:**
   | Key                    | Value                                                   |
   | ---------------------- | ------------------------------------------------------- |
   | `NODE_ENV`             | `production`                                            |
   | `PORT`                 | `4000` (Render will override with its own)              |
   | `CORS_ORIGIN`          | your Vercel URL, e.g. `https://ai-gen.vercel.app`       |
   | `DATABASE_URL`         | from step A.1                                           |
   | `JWT_ACCESS_SECRET`    | `openssl rand -hex 48`                                  |
   | `JWT_REFRESH_SECRET`   | `openssl rand -hex 48` (**different** from access)      |
   | `JWT_ACCESS_TTL`       | `15m`                                                   |
   | `JWT_REFRESH_TTL`      | `30d`                                                   |
   | `BCRYPT_ROUNDS`        | `12`                                                    |
   | `COOKIE_SECURE`        | `true`                                                  |

6. First deploy will build the shared package, generate the Prisma client, and
   apply the initial migration. Subsequent deploys just build + start.

**Railway:** same steps, but use the **Dockerfile** deploy option and point it
at `apps/backend/Dockerfile` — it handles everything above automatically.

### A.3 — Deploy the frontend on Vercel

1. Import the repo in Vercel.
2. **Root Directory:** `apps/frontend`
3. **Build Command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @ai-gen/frontend build`
4. **Output Directory:** `.next`
5. **Install Command:** `corepack enable`
6. Environment variables:
   | Key                     | Value                                       |
   | ----------------------- | ------------------------------------------- |
   | `NEXT_PUBLIC_API_URL`   | your Render/Railway backend URL             |
   | `NEXT_PUBLIC_APP_NAME`  | `AI App Generator` (or anything)            |

7. Deploy. Open the URL. You should be able to sign up, create an app, publish
   a config, and see records flow end-to-end.

### A.4 — Post-deploy smoke test

```bash
# Replace with your actual URLs.
BACKEND=https://your-backend.onrender.com
FRONTEND=https://your-frontend.vercel.app

# 1. Health
curl $BACKEND/health

# 2. From the frontend: register → create an app → publish a config → create
#    a record. You should see a notification fire on the bell.
```

---

## B. Docker Compose on a single host

Works on any Linux VPS (DigitalOcean / Hetzner / EC2 / Lightsail), or locally.

```bash
git clone <your-fork>
cd Ai-genrator-App

# 1. Adjust secrets in docker-compose.yml (JWT_*_SECRET, DB creds).
# 2. Bring the stack up — this also applies Prisma migrations automatically.
docker compose up -d --build

# 3. Verify
docker compose ps
curl http://localhost:4000/health
open http://localhost:3000
```

Tear down / reset data:

```bash
docker compose down          # keep data
docker compose down -v       # wipe the postgres volume too
```

### Putting it behind a real domain

Stick any reverse proxy in front — Caddy is the fastest:

```Caddyfile
app.example.com {
  reverse_proxy frontend:3000
}
api.example.com {
  reverse_proxy backend:4000
}
```

Update in `docker-compose.yml`:

- `CORS_ORIGIN=https://app.example.com`
- `COOKIE_SECURE=true`
- build arg `NEXT_PUBLIC_API_URL=https://api.example.com`

---

## C. Generic production notes

### Migrations

The backend image runs `prisma migrate deploy` on boot — every release
automatically applies any new migrations, atomically. Locally you still
develop with `pnpm db:migrate`.

### Secrets

Rotate both JWT secrets by shipping a new deployment; all existing sessions
will be invalidated on their next refresh — which is the correct behavior.

### Observability

- Liveness: `GET /health` returns `200 { ok: true }`.
- Request logs: morgan writes to stdout; pipe to your platform's log sink.

### Scaling

- **Backend** is stateless (JWTs + DB sessions) → horizontal scale freely.
- **CSV imports** currently cache parsed uploads in-process for 15 min; if you
  run > 1 backend replica and want perfect continuity across replicas, swap
  the `uploads` Map in `apps/backend/src/modules/import/import.service.ts`
  for Redis. Everything else is cluster-safe as-is.
- **Database**: the heavy table is `records` (JSONB + GIN). Bump the managed
  Postgres tier before the app tier.

### Seed / first admin

```bash
# On the container:
docker compose exec backend npx prisma db seed
```

(No seed file is required — users sign up via the UI.)

---

## Troubleshooting

| Symptom                                        | Likely cause / fix                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `CORS` error in the browser                    | `CORS_ORIGIN` on the backend must exactly match the frontend URL.        |
| `401` on every API call                        | `JWT_*_SECRET` changed — clear localStorage on the frontend and re-login. |
| `Can't reach database server`                  | `DATABASE_URL` wrong or Postgres not ready; check the healthcheck logs.   |
| Frontend build fails on `@ai-gen/shared`       | Build context must include the monorepo root, not just `apps/frontend/`. |
| Prisma migration fails with `relation exists`  | Database already has old tables; use a fresh DB or `prisma migrate reset`.|

---

## One-click buttons (nice to add)

You can drop these in the root README once your repo is public:

```markdown
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR/REPO)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2FYOUR%2FREPO)
```
