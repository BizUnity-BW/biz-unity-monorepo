---
description: Reconcile the biz-unity codebase against the ClickUp tracker and produce a delivery punch-list — find drift, untracked gaps, and stale statuses.
argument-hint: [optional focus, e.g. "backend rbac" or "invoices module"]
---

Audit the **biz-unity** project's real implementation state against its ClickUp tracker, so the
tracker stays trustworthy as the single source of truth all the way to delivery. This is a
reconciliation pass, not a shipping pass — use `/ship-from-clickup` to execute one ticket, and
`/compound` to capture a report after implementation work. Optional focus from the user:
`$ARGUMENTS` (a module, area, or theme to concentrate on — default to the whole tracker).

## ClickUp coordinates

- Workspace id: `90152634101`
- Space: **biz-unity** (`901511593418`)
- List: **List** (`901524727897`) — the only list in the space; every ticket lives here
- Ticket titles follow `[Category] Short description` (categories seen so far: `Feature`, `Bug`,
  `Infra`, `Security`, `Perf`, `Reliability`, `Auth`, `DevX`, `Frontend`)
- Ticket URL pattern: `https://app.clickup.com/t/<id>`

## 1. Pull current tracker state

Use `clickup_filter_tasks` with `list_ids: ["901524727897"]` and `include_closed: true` (paginate if
`has_more` is true). Group the results by status (`to do`, `in progress`, `complete`/`closed`, any
others in use). This is ground truth for what the team *believes* is outstanding or done — the audit
below checks it against what the code actually does.

## 2. Scope the code sweep

If `$ARGUMENTS` names an area, focus the sweep there. Otherwise sweep broadly: read
`backend/prisma/schema.prisma`, the touched `backend/src/modules/<domain>/{routes,controller,service}.ts`
files, and the relevant `frontend/src/pages/**` for each open ticket's subject area. For anything
wider than a handful of targeted reads, delegate to an `Explore` agent rather than grepping
file-by-file inline.

Known project shape (see root `CLAUDE.md` for the authoritative version): backend modules under
`src/modules/<domain>/`, every tenant query scoped by `orgId` via `requireTenant`, RBAC dimensions
`SystemRole` and `OrgRole` defined in `prisma/schema.prisma` but check whether they are actually
*enforced* anywhere (a previous audit found they are declared but unused — verify this is still
true or has since been fixed).

## 3. Cross-check every ticket against the code

For each ticket, classify it into one of:

- **Confirmed complete** — status is `complete`/`closed` and the code genuinely does what the title
  claims. Spot-check, don't just trust the status.
- **Confirmed in progress / to do** — status matches reality; nothing to flag.
- **Drift: marked done, but code says otherwise** — e.g. a regression, or the ticket was closed
  before the acceptance criteria were actually met. Flag with the specific file/line evidence.
- **Drift: marked outstanding, but already implemented** — partially or fully built without the
  ticket being updated. Flag with evidence; do not change the ticket status yourself without saying
  so first (see step 5).
- **Untracked gap** — a real gap in the implementation (missing authorization check, missing route,
  missing validation, etc.) that has **no corresponding ticket at all**. This is the most valuable
  finding — the tracker can only be a source of truth for what it knows about.

## 4. Present the punch-list

Report grouped by the classification above, most actionable first (untracked gaps and drift before
"all good"). For each item: ticket id + title (or "no ticket" for untracked gaps), one-line evidence
from the code (`file:line`), and a suggested next action. Keep it a punch-list, not prose — this is
meant to be scannable before a delivery checkpoint.

## 5. Act only on confirmation

Creating, closing, or re-statusing ClickUp tickets is a shared, visible action — **propose it, then
wait for explicit go-ahead** before calling `clickup_create_task` / `clickup_update_task`. When the
user confirms:

- New tickets for untracked gaps: follow the `[Category] Title` naming convention, set priority
  using the same scale already in use (`urgent` > `high` > `normal` > `low`), and put the evidence
  from step 3 in the description so the next person (or a future `/ship-from-clickup` run) has
  context without re-deriving it.
- Status corrections for drift: update the ticket status and leave a comment explaining why (link
  the commit/PR for "already implemented" cases; describe the regression for "marked done but
  broken" cases).
- Never mark a ticket complete yourself based on a code read alone — completion should trace to a
  merged PR or a verified manual test, not just "the code looks right."

## 6. Close out

Summarize what changed in the tracker (tickets created/updated, with links) and what's still open
for the user to decide on. If this surfaces a durable convention worth remembering (e.g. "the tracker
only ever has one list", "RBAC enforcement has no ticket and keeps getting missed"), mention it so it
can be captured via `/compound` or repo memory rather than rediscovered next run.
