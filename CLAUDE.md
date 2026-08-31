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
| Deploy | Frontend → Vercel, Backend → Railway |

---

## Commands

> There is no root `package.json`. This is not an npm-workspace monorepo — `backend/`, `frontend/` and `admin/` are independent projects. Always `cd` into the one you're working on before running scripts. There is no test runner configured in any workspace.

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
npm run storage:provision  # create/reconcile the Supabase Storage buckets (idempotent)
npm run storage:sweep      # reap abandoned PENDING_UPLOAD documents (--hours N, --dry-run)
npm run admin:grant -- <email> [--revoke]   # grant/revoke SYSTEM_ADMIN
```

> **`backend/.env`'s `DATABASE_URL` points at live Supabase.** Never run `prisma migrate dev`
> against it — it operates on production data and can offer to reset. Develop a migration with the
> URL overridden to the local Docker Postgres, then `npm run migrate:deploy` for the real thing. A
> required column on a non-empty table needs the generated SQL hand-split into add-nullable →
> backfill → `SET NOT NULL`. See
> `docs/solutions/bug-fixes/prisma-migration-history-vs-db-push-drift.md`.

> Operational scripts live in `backend/src/scripts/`, **not** `prisma/scripts/` — the latter sits
> outside `rootDir` so `npm run build` never typechecks it. They run under `ts-node --files`;
> without `--files`, ts-node skips the tsconfig `include` and loses the ambient `@types/node`.

### Frontend (`cd frontend`)
```bash
npm run dev          # Vite dev server on :5173
npm run build        # tsc -b + vite build → dist/
npm run preview      # preview production build locally
npm run lint         # eslint
npm run format       # prettier --write src/**/*.{ts,tsx,json}
npm run format:check # prettier --check (used in CI)
```

### Admin console (`cd admin`)
```bash
npm run dev          # Vite dev server on :5174 (runs alongside the tenant app on :5173)
npm run build        # tsc -b + vite build → dist/
npm run lint         # eslint
npm run format:check # prettier --check (used in CI)
```

> The admin console is the **platform back-office**: BizUnity staff, cross-tenant. An admin is a
> `UserProfile` with `systemRole = SYSTEM_ADMIN` and `organisationId = null`. Grant it with
> `cd backend && npm run admin:grant -- <email>` — there is no self-signup in the admin app.

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

All routes are mounted under `/api/v1` in `src/routes/index.ts` (`auth`, `organisations`, `users`,
`customers`, `quotations`, `invoices`, `payments`, `documents`, `verified-payments`, `admin`). Each
business domain lives in `src/modules/<domain>/` with three files: `routes.ts`, `controller.ts`, and
`service.ts`. **`admin` extends that by one level** — `src/modules/admin/<domain>/{routes,controller,service}.ts`
— so the whole cross-tenant surface sits in one directory that is easy to audit. The `auth` module is the exception — it has only `routes.ts` + `controller.ts` (it proxies Supabase Auth and holds no service logic).

**Request lifecycle:**
1. `src/app.ts` — helmet, cors, rate-limiter, then `/api/v1` router
2. `src/middleware/auth.ts` — validates the Supabase JWT and attaches `req.user`
3. `src/middleware/tenant.ts` (`requireTenant`) — looks up the `UserProfile` by `supabaseId`, resolves its `Organisation`, and attaches `req.org` (`{ id, name, slug }`) plus `req.profile` (including `orgRole`); returns 403 if the user has no org
4. `src/middleware/orgRole.ts` (`requireOrgRole(...roles)`) — **per-route** org-role guard, on the restricted routes only
5. Module controller — validates with Zod, calls service, returns via `ok()`/`fail()` helpers
6. `src/middleware/error.ts` — global catch-all error handler

**Authorization has two orthogonal axes.** `systemRole` (platform) is guarded once at the parent
router by `requireSystemAdmin`; `orgRole` (OWNER/MANAGER/SALES, within an org) is guarded
**per-route** by `requireOrgRole`, because the permission matrix is per-verb — SALES may `POST` a
payment but not `DELETE` one, which no parent-level guard can express. A tenant route with no
`requireOrgRole` is open to all three roles *by design*; each route file carries a comment saying so.
**If you add a restricted tenant route, add its guard in the same commit** — a later sweep cannot
tell a deliberate omission from a forgotten one. Note `actorRole` in the payments/documents services
is audit provenance snapshotted onto `VerificationEvent`, **not** an authorization check; nothing
branches on it. See `docs/solutions/conventions/org-role-authorisation-per-route.md`.

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
- `src/store/tenantStore.ts` / `src/store/themeStore.ts` — the other two Zustand stores (current org, light/dark theme)
- `src/api/client.ts` — axios instance with a request interceptor that reads the active Supabase session and injects `Authorization: Bearer <token>`. Per-domain callers (`src/api/customers.ts`, `invoices.ts`, `quotations.ts`, `payments.ts`, `auth.ts`, `documents.ts`, `organisations.ts`, `users.ts`, `verifiedPayments.ts`) wrap this client — add new API calls there, not inline in components.
- `src/hooks/` — `useAuth` subscribes to `supabase.auth.onAuthStateChange` and syncs the store; `useAuthInit` / `useThemeInit` bootstrap state on mount; `useTenant` reads the active org; `useDocumentUpload` owns the upload queue (see **File uploads** below)
- `src/components/layout/AppShell.tsx` — shell wrapper with Sidebar + Header + `<Outlet />`
- `src/components/ui/` — `SkeletonShimmer`, `StatusPill`, `ThemeToggle`, `Avatar`, `icons` are in use.
  `Button`, `Card`, `Input`, `Modal`, `Badge` are **not** — see the warning under *Design system*
- `src/components/upload/` — `DocumentUploader`, `ImageUploader`, `FileDropZone`, `UploadQueue`
- `src/components/{ConfigError,ErrorBoundary}.tsx` — startup guards. A missing Supabase env var used
  to throw during module evaluation, before React mounted, blanking the page with no overlay; `src/lib/env.ts`
  now collects the problem and `App` renders `ConfigError` instead
- New users flow through onboarding (`src/pages/onboarding/CompleteProfile.tsx` → `CompanySetup.tsx`) before reaching the dashboard

**Path alias:** `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### Admin console (`admin/`)

A third independent project on the same stack as `frontend/`, sharing this backend, database and
Supabase project. It talks only to `/api/v1/admin/*`, which applies `requireAuth` +
`requireSystemAdmin` **once at the parent router** (`backend/src/modules/admin/routes.ts`) so a
sub-route added later cannot ship unguarded.

Two rules that are load-bearing:

- **Admin services deliberately do not filter by `organisationId`.** That is the point of the routes, and it
  is why they live only under `backend/src/modules/admin/`. A missing `organisationId` filter is
  intentional there and a bug everywhere else — never import across that boundary.
- **`SystemAdminRoute` must not reuse the tenant app's `ProfileGuard`.** That guard sends any profile
  without an `organisationId` to `/onboarding/company`, and platform admins have no organisation, so
  it would trap every one of them in a loop they can never complete.

Shared frontend code (design tokens, api client, auth store, types, a few `ui/` primitives) is
**copied**, not extracted into a package, matching the no-workspaces convention. The copied set is
tracked in ClickUp 86cb8q62z; if it drifts painfully, the exit ramp is npm workspaces.

---

## Prisma schema summary

```
Organisation → UserProfile (many)   // UserProfile.supabaseId links to Supabase Auth
Organisation → Customer (many)
Organisation → Quotation (many) → QuotationItem (many)
                                 ↘ Invoice (many) → InvoiceItem (many)
                                                  ↘ Payment (many) → Document (many, proof of payment)
Organisation → Document (many)      // compliance/KYC docs, logos; UserProfile for avatars
Document | Payment → VerificationEvent (many)   // append-only audit trail
```

Enums: `OrgRole`, `SystemRole`, `QuotationStatus`, `InvoiceStatus`, `PaymentMethod`,
`VerificationStatus`, `DocumentKind`, `DocumentUploadStatus`, `DocumentReviewStatus`,
`VerificationEventType`.

All tenant-scoped entities carry `organisationId` (not `orgId` — no such column exists) — always filter by it to enforce tenant isolation. The one deliberate exception is `src/modules/admin/`, which is cross-tenant by design. The DB user identity is `UserProfile` (keyed to Supabase Auth via `supabaseId`), not a bare `User`.

**Soft deletes.** `Organisation`, `Customer`, `Quotation`, `Invoice`, `Document` and `Payment` all
carry `deletedAt` and are **never** hard-deleted. Read through the model's exported live filter
(`liveDocumentFilter`, `livePaymentFilter`) rather than writing `deletedAt: null` inline, so there is
one definition and one name to grep. Two rules that bite:

- **Before adding any hard delete, check every inbound relation's `onDelete`.** An absent `onDelete`
  is not "no behaviour" — Prisma defaults to `SetNull` for optional relations. Hard-deleting a
  `Payment` would cascade away its proof-of-payment documents *and* NULL `paymentId` on its
  append-only `verificationEvents`.
- **Adding a `deletedAt` column is a sweep of every existing reader, not a new field.** Nested
  `include`s need their own `where`, aggregates need it in both directions, and a
  `findUnique({ where: { id } })` must become `findFirst` to take the filter at all. A miss fails
  silently and in the worst direction. See
  `docs/solutions/architecture-patterns/soft-delete-and-the-append-only-audit-trail.md`.

---

## CI/CD

`.github/workflows/ci.yml` runs format check + lint + build for both workspaces on every push/PR to
`main` or `develop`. On a push to `main` (i.e. once a PR is merged), a `deploy-backend` job runs
after the `backend` checks pass and deploys to Railway via the Railway CLI (needs the
`RAILWAY_TOKEN` secret and `RAILWAY_SERVICE_NAME` repo variable set). There is no production
environment yet — `main` is the only deploy target for now.

The frontend is **not** deployed by this workflow: Vercel's own Git integration auto-deploys on
push to `main` independently of GitHub Actions.

**Migrations run on deploy**, via `preDeployCommand` in `backend/railway.json`
(`npm run migrate:deploy`). Railway runs it before the new version takes traffic, so a failed
migration aborts the release and leaves the previous version serving — rather than replacing it with
code whose tables do not exist. Two consequences worth knowing:

- **Never put `migrate dev` or `db push` in that hook.** Only `migrate deploy`, which respects
  existing history. The deployed database's `initial_schema` row was baselined by hand
  (`applied_steps_count = 0`), so anything that tries to re-derive history will fight it.
- `migrate deploy` needs **`DIRECT_URL`** (the non-pooled connection) set in the Railway
  environment. A pooled `DATABASE_URL` on `:6543` is unreliable for DDL and advisory locks.

Deploy config: `frontend/vercel.json` (SPA rewrites), `backend/railway.json` (Railway build/start
commands, Nixpacks builder).

---

## Design system (read before building any UI)

`docs/BIZUNITY_DESIGN_PRINCIPLES.md` is a mandatory brand brief — treat it as a system-level design brief whenever generating, scaffolding, or refining any BizUnity UI. BizUnity is a premium SME SaaS product for the Southern African market: gold (`--brand-gold: #C9A24D`) on near-black, minimal and boutique-fintech in feel. Use the exact CSS custom-property tokens defined there (`--brand-*`, `--text-*`, `--bg-*`); never substitute generic Tailwind defaults like `blue-500` or `gray-200`.

`docs/BizUnity_MVP1_Technical_Implementation.docx` holds the MVP1 technical spec.

**Building pages:** follow the shipping convention in `src/pages/onboarding/CompanySetup.tsx` — inline Tailwind referencing the `var(--color-*)` tokens in `src/index.css`, with `amber-500` as the gold accent, and React Hook Form + Zod for forms. The `src/components/ui/` primitives (`Button`, `Badge`) reference `btn`/`badge` classes that are **not defined** in `index.css`, and `Card`/`Input`/`Modal` are hardcoded light-mode — do not use them as-is (see `docs/solutions/conventions/frontend-ui-tokens-not-ui-primitives.md`).

**Loading states:** for pages with a fixed layout and data-shaped holes (detail pages, the
dashboard), wrap the content in `src/components/ui/SkeletonShimmer.tsx` and render it with a
stand-in object from `src/lib/skeletonPlaceholders.ts` — the underlying library measures the
*rendered* children, so a `loading ? spinner : content` shape produces an empty skeleton. Mark
static chrome with `data-shimmer-ignore`. Do not use it for list pages or full-page bootstrap
spinners (see `docs/solutions/integration-issues/shimmer-from-structure-needs-rendered-children.md`).

**Icons:** there is no icon library and none is being added. Shared glyphs live in
`src/components/ui/icons.tsx` (components only, so `react-refresh/only-export-components` stays
quiet); one-off icons are inlined as `<path>` in the Heroicons style already used by `Sidebar`.

**File uploads:** never post a file to our API. The browser gets a signed upload URL and PUTs
straight to Supabase Storage, then confirms. Use `useDocumentUpload` (which owns validation, the
queue and leg-aware retry) with `DocumentUploader` for files or `ImageUploader` for a single
replace-in-place image — do not call the storage or documents API directly from a page. Read
`docs/solutions/architecture-patterns/three-legged-signed-url-uploads.md` first; the
idempotent-confirm and `uploadStatus: READY` filtering rules are load-bearing.

**Printing:** `index.css` has an `@media print` block that re-points the `--color-*` tokens for
paper — without it this dark-first app prints white-on-white. Hide chrome with `data-print-hide`
and let the shell unroll with `data-print-expand`. Always check a printable page in **both**
themes.

---

## Compound engineering workflow

Every piece of work should leave the project easier to work on next time. The loop is
**Plan → Implement → Report → Learn → Update context**, and it is enforced by the `/compound`
command plus a `Stop` hook (see `.claude/`).

### Artefacts (local working notes — gitignored, not committed)

| Artefact | Location | Naming | When |
|---|---|---|---|
| Plan | `docs/plans/` | `YYYY-MM-DD-<type>-<slug>-plan.md` | before / while building |
| Implementation report | `docs/reports/` | `YYYY-MM-DD-<slug>-report.md` | after building |
| Learning | `docs/solutions/<category>/` | `<slug>.md` (+ YAML frontmatter) | after building, if non-obvious |
| Vocabulary glossary | `CONCEPTS.md` (repo root) | one accreting file | when new domain terms appear |

`<type>` ∈ `feat` `fix` `chore` `refactor` `docs`. `<category>` ∈ `bug-fixes/`
`architecture-patterns/` `conventions/` `developer-experience/` `security-issues/`
`integration-issues/` `tooling-decisions/`. Templates for each artefact live in
`.claude/templates/`. These paths are gitignored on purpose: the **method** (this section, the
command, the hook, the templates) is shared; the **notes** stay local.

### The rule — after completing any implementation

Before ending, run the `/compound` capture routine (or do it inline):

1. **Report** — write an implementation report to `docs/reports/` (what changed, why, files touched,
   how it was verified, follow-ups, and any linked ClickUp task).
2. **Learn** — if anything non-obvious was learned, capture it under `docs/solutions/<category>/`.
   **Check for an existing solution doc and update it (bump `last_updated`) rather than duplicating.**
   For a bug/fix, use the **Symptom / Cause / Fix / Date last verified** shape.
3. **Vocabulary** — add any new domain terms to `CONCEPTS.md`.
4. **Ways of working** — update *this* `CLAUDE.md` only if a durable convention or workflow changed.

The `Stop` hook nudges (blocks once, self-clearing) if source files under `backend/src`,
`frontend/src`, or `backend/prisma` changed but no fresh report was captured. Writing the report
clears it; errors in the hook never break the session.
