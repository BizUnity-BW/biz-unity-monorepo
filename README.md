# BizUnity

**BizUnity** is a premium, multi-tenant SaaS for **SMEs in the Southern African market** (primary:
Botswana). It gives a business one place to manage **customers, quotations, invoices, and payments**,
with each organisation's data isolated by tenant. Payments are being built toward **funder-grade
traceability** (proof-of-payment + independent verification) so the records can be used to prove
business performance to funding organisations.

> This repo is **two independent projects** — `backend/` and `frontend/`. There is **no root
> `package.json`**; run commands inside each workspace. See [`CLAUDE.md`](CLAUDE.md) for the detailed
> architecture and [`docs/BIZUNITY_DESIGN_PRINCIPLES.md`](docs/BIZUNITY_DESIGN_PRINCIPLES.md) for the
> brand/design system.

---

## What's built

Customers (CRUD), Quotations (create/edit/status), Invoices (created by converting a quotation),
Payments (record against an invoice, auto-updating balance/status), a Tenant Dashboard, and a
responsive app shell with light/dark theming. Remaining work is tracked in ClickUp — see
[Shipping features](#shipping-features).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, React Router v7, Zustand |
| Backend | Node.js, Express 5, TypeScript, Prisma 6 (PostgreSQL), Zod |
| Auth | Supabase Auth |
| Deploy | Frontend → Vercel, Backend → Render |

## Repository layout

```
backend/    Express + Prisma API (module pattern under src/modules/*)
frontend/   React + Vite SPA
docs/        Design principles, MVP spec (+ local compound-engineering notes: plans/reports/solutions)
.claude/     Project commands (/compound, /ship-from-clickup), templates, hooks, settings
```

---

## Prerequisites

- **Node.js 20+** and npm
- **Docker** (only if you want to run Postgres locally) — or access to the shared Supabase database
- A **Supabase** project (provides Auth + Postgres). Keys come from the Supabase dashboard.

---

## Quick start

Clone, then set up each workspace. **Both apps read their env files only at startup** — see
[Environment variables](#environment-variables) first.

### 1. Backend (`cd backend`)

```bash
cp .env.example .env        # then fill in the values (see table below)
npm install
npm run generate            # prisma generate (creates the typed client)
npm run migrate             # prisma migrate dev (applies the schema to your DB)
npm run dev                 # nodemon + ts-node on http://localhost:4000
```

### 2. Frontend (`cd frontend`)

```bash
cp .env.example .env.local  # then fill in the values (see table below)
npm install
npm run dev                 # Vite dev server on http://localhost:5173
```

### 3. Database — pick one

- **Local Postgres (Docker)** — the default in `backend/.env.example`. From the repo root:
  ```bash
  docker compose up -d       # Postgres on :5432 (bizunity/bizunity/bizunity)
  ```
  Then run `npm run migrate` in `backend/`.
- **Supabase Postgres** — point `DATABASE_URL`/`DIRECT_URL` at the Supabase connection-pooler strings
  from the dashboard (transaction pooler `:6543` for `DATABASE_URL`, session pooler `:5432` for
  `DIRECT_URL`). The schema is already migrated there.

Open **http://localhost:5173**, register an account, and complete onboarding (profile → company).

---

## Environment variables

Copy the `.env.example` in each workspace and fill in real values. **Never commit real secrets** —
`.env` and `.env.local` are gitignored. Placeholders below; get Supabase values from
**Supabase Dashboard → Project Settings → API** and the DB strings from **Database → Connect**.

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string used by the app (via the pooler when on Supabase). |
| `DIRECT_URL` | ✅ | Direct/session Postgres connection used for migrations. |
| `SUPABASE_URL` | ✅ | Your Supabase project URL, e.g. `https://<ref>.supabase.co`. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Secret** service-role key (bypasses RLS; backend-only). From API settings. |
| `FLAGSMITH_ENVIRONMENT_KEY` | ➖ | Flagsmith server key (optional; feature flags). |
| `FRONTEND_URL` | ➖ | Allowed frontend origin for CORS, e.g. `http://localhost:5173`. |
| `PORT` | ➖ | API port (default `4000`). |
| `NODE_ENV` | ➖ | `development` \| `production` \| `test` (default `development`). |
| `RATE_LIMIT_ENABLED` | ➖ | `true`/`false`. Set **`false`** locally to avoid 429s during heavy testing. |

> The backend validates its env on boot (`src/config/env.ts`) and **exits** if a required variable is
> missing or malformed.

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL (same project as the backend). |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Public **anon** key (safe in the browser; used for Auth only). |
| `VITE_API_URL` | ✅ | Base URL of the backend API, e.g. `http://localhost:4000`. |
| `VITE_FLAGSMITH_ENVIRONMENT_KEY` | ➖ | Flagsmith client environment key (optional). |

> If `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are missing, the Supabase client throws on load and
> the app renders a blank screen — fill them in and restart Vite.

---

## Common commands

### Backend (`cd backend`)
```bash
npm run dev            # dev server (nodemon + ts-node) on :4000
npm run build          # tsc → dist/
npm start              # node dist/server.js
npm run lint           # eslint
npm run format         # prettier --write
npm run migrate        # prisma migrate dev
npm run migrate:deploy # prisma migrate deploy (production)
npm run generate       # prisma generate (after schema changes)
npm run studio         # prisma studio (DB browser)
```

### Frontend (`cd frontend`)
```bash
npm run dev            # Vite dev server on :5173
npm run build          # tsc -b + vite build → dist/
npm run preview        # preview the production build
npm run lint           # eslint
npm run format         # prettier --write
```

> There is **no test runner** configured in either workspace yet.

---

## Shipping features

Project work is tracked in **ClickUp** (the biz-unity board) — it's the source of truth for the backlog.

The repo ships two project slash commands (Claude Code):

- **`/ship-from-clickup <ticket-id | title>`** — ships a feature end-to-end from a ClickUp ticket:
  resolve ticket → brainstorm → plan → branch → implement → verify → review → open a PR. It stops at
  two checkpoints (before writing code, and before opening the PR).
- **`/compound [slug]`** — after any implementation, captures an implementation report, records durable
  learnings, and updates project context (see the *Compound engineering workflow* section of
  [`CLAUDE.md`](CLAUDE.md)). Artefacts live under `docs/` and are gitignored (local working notes).

### Manual flow (equivalent)

1. Branch off `main`: `git checkout -b feat/<slug>`.
2. Implement following the conventions in [`CLAUDE.md`](CLAUDE.md) (backend `routes → controller → service`,
   every query scoped by `orgId`; frontend inline Tailwind + `var(--color-*)` tokens + amber accent,
   API calls wrapped in `src/api/*`). Run a Prisma migration if the schema changed.
3. Verify: `npx tsc --noEmit` (backend) / `npx tsc -b --noEmit` (frontend) + `npm run lint` in each
   touched workspace, and exercise the real flow in the browser.
4. Open a PR. **CI** (`.github/workflows/ci.yml`) runs lint + build for both workspaces on every
   push/PR to `main` or `develop`.

---

## Deployment

- **Frontend → Vercel** — SPA rewrites in [`frontend/vercel.json`](frontend/vercel.json).
- **Backend → Render** — service config in [`backend/render.yaml`](backend/render.yaml). Set the same
  env variables there; run `npm run migrate:deploy` on release; ensure `NODE_ENV=production`.

---

## Development gotchas

- **Env changes need a full server restart.** Neither Vite nor nodemon reloads `.env`/`.env.local`
  automatically — stop and restart the dev server after editing them.
- **Rate limiting** (`RATE_LIMIT_ENABLED=true`) can return `429` during intensive local testing, which
  can surface as an unexpected redirect to onboarding. Set `RATE_LIMIT_ENABLED=false` for local dev.
- **Email confirmation** is auto-confirmed in non-production so you can register and sign in immediately;
  production requires real confirmation.
