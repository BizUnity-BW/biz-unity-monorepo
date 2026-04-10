# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend | Node.js + Express v5 + TypeScript 6 |
| ORM | Prisma v6 (PostgreSQL) |
| Validation | Zod v4 (backend), React Hook Form + Zod (frontend) |
| Auth | Supabase Auth |
| State | Zustand v5 |
| Feature flags | Flagsmith |
| Deploy | Frontend → Vercel, Backend → Render |

---

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # start with nodemon + ts-node on :4000
npm run build        # tsc → dist/
npm start            # node dist/server.js
npm run lint         # eslint src/**/*.ts
npm run format       # prettier --write src/**/*.{ts,json}
npm run format:check # prettier --check (used in CI)
npm run migrate      # prisma migrate dev
npm run migrate:deploy  # prisma migrate deploy (production)
npm run generate     # prisma generate (after schema changes)
npm run studio       # prisma studio
```

### Frontend (`cd frontend`)
```bash
npm run dev          # Vite dev server on :5173
npm run build        # tsc -b + vite build → dist/
npm run preview      # preview production build locally
npm run lint         # eslint
npm run format       # prettier --write src/**/*.{ts,tsx,json}
npm run format:check # prettier --check (used in CI)
```

### Local DB
```bash
docker compose up -d          # start Postgres on :5432
docker compose down           # stop
```

---

## Environment setup

Copy and fill in both `.env.example` files before running anything:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

For local dev the `DATABASE_URL` and `DIRECT_URL` in `backend/.env` point to the Docker Postgres container (credentials already set in `docker-compose.yml`).

After filling in `.env`, run the first migration:
```bash
cd backend && npm run migrate
```

---

## Architecture

### Backend

All routes are mounted under `/api/v1` in `src/routes/index.ts`. Each business domain lives in `src/modules/<domain>/` with three files: `routes.ts`, `controller.ts`, and `service.ts`.

**Request lifecycle:**
1. `src/app.ts` — helmet, cors, rate-limiter, then `/api/v1` router
2. `src/middleware/auth.ts` — validates the Supabase JWT and attaches `req.user`
3. `src/middleware/tenant.ts` — resolves the org from the DB and attaches `req.org`
4. Module controller — validates with Zod, calls service, returns via `ok()`/`fail()` helpers
5. `src/middleware/error.ts` — global catch-all error handler

**Key files:**
- `src/config/env.ts` — Zod-validated env (crashes on startup if vars are missing)
- `src/config/prisma.ts` — singleton PrismaClient
- `src/config/supabase.ts` — Supabase admin client (service-role key)
- `src/shared/utils/index.ts` — `ok()` / `fail()` response helpers
- `src/shared/validators/index.ts` — shared Zod schemas used across modules
- `prisma/schema.prisma` — canonical DB schema (Organisation → User, Customer, Quotation, Invoice, Payment)

### Frontend

`src/App.tsx` defines all React Router v7 routes. Protected routes check `isAuthenticated` from `useAuth` hook and redirect to `/login` otherwise.

**Key wiring:**
- `src/store/authStore.ts` — exports the Supabase client (`supabase`) and Zustand auth store; the client is imported by `src/api/client.ts` to attach the JWT
- `src/api/client.ts` — axios instance with a request interceptor that reads the active Supabase session and injects `Authorization: Bearer <token>`
- `src/hooks/useAuth.ts` — subscribes to `supabase.auth.onAuthStateChange` and syncs to the Zustand store
- `src/components/layout/AppShell.tsx` — shell wrapper with Sidebar + Header + `<Outlet />`

**Path alias:** `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

---

## Prisma schema summary

```
Organisation → User (many)
Organisation → Customer (many)
Organisation → Quotation (many) → Invoice (many) → Payment (many)
```

All entities carry `orgId` — always filter by it to enforce tenant isolation.

---

## CI/CD

`.github/workflows/ci.yml` runs lint + build for both workspaces on every push/PR to `main` or `develop`.

Deploy config: `frontend/vercel.json` (SPA rewrites), `backend/render.yaml` (Render web service).
