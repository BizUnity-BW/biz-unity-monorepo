---
description: Ship a feature end-to-end from a ClickUp ticket — brainstorm, plan, branch, implement, review, open a PR.
argument-hint: <clickup ticket id (e.g. 86cawph2x) or ticket title>
---

Ship a feature for the **biz-unity** project driven by a ClickUp ticket. Input `$ARGUMENTS` is a ClickUp
**ticket id** (e.g. `86cawph2x`) or a **title** (or fragment).

Follow the pipeline below in order. Honour `CLAUDE.md`: two independent workspaces (`backend/`,
`frontend/`), the backend `routes → controller (Zod) → service` module pattern with every query
tenant-scoped by `orgId`, and the frontend convention (inline Tailwind + `var(--color-*)` tokens +
amber accent, React Hook Form + Zod, API calls wrapped in `src/api/*`). There is no test runner.
**Never work on `main`.** The two **CHECKPOINTS** are mandatory — stop and wait for the user there.

## 0. Resolve the ticket
- If `$ARGUMENTS` looks like a ClickUp id, fetch it with the ClickUp "get task" tool. Otherwise search
  the **biz-unity** list (`list_id 901524727897`) by title; if there are multiple matches, ask which one.
- Read: title, description, **decisions**, acceptance criteria, **dependencies**, and open questions.
- If the ticket is **blocked** (a `waiting_on` dependency isn't complete), stop, say so, and offer to
  ship the blocker instead.
- Set the ticket status to **in progress**.

## 1. Brainstorm
- Explore the codebase for the relevant files, existing patterns, and reusable utilities before writing
  anything (e.g. the module pattern, `requireTenant`, `StatusPill`, `formatMoney`, `src/lib/format.ts`,
  the design tokens). Prefer reuse over new code.
- Restate the feature in your own words and list your assumptions.
- If an **open question in the ticket materially changes scope**, ask the user (AskUserQuestion) before
  planning, and record the answers back on the ticket as a comment.

## 2. Plan
- Write a concise implementation plan: Prisma/schema changes (+ migration), backend module changes,
  frontend (API caller, pages/components, routes), and exactly how you'll verify it end-to-end.
- Save it to `docs/plans/<YYYY-MM-DD>-<type>-<slug>-plan.md` (compound workflow; `<type>` ∈
  feat|fix|chore|refactor).
- **CHECKPOINT 1 — present the plan and wait for the user's go-ahead before writing any code.**

## 3. Branch
- Confirm a clean working tree (`git status`); if unrelated changes exist, ask before continuing.
- Branch off the default branch: update `main`, then `git checkout -b <type>/<ticket-id>-<slug>`.

## 4. Implement
- Build per the plan and the repo conventions above. Tenant-scope every query by `orgId`; validate and
  tenant-guard any client-supplied id. Keep the diff scoped to this ticket.
- On schema changes: `cd backend && npx prisma migrate dev --name <slug> && npx prisma generate`.

## 5. Verify
- Type-check: `cd backend && npx tsc --noEmit` **and** `cd frontend && npx tsc -b --noEmit`; run
  `npm run lint` in each touched workspace. Fix everything before proceeding.
- For any UI, drive the **real flow** in the browser (Claude Browser) against the running dev servers —
  screenshot it and check the console for errors. A green type-check is not proof it works; exercise the
  actual path against the real API. (If the dev servers aren't up, start them; remember env changes need
  a full restart.)

## 6. Review
- Run a code review over the branch diff (invoke `/code-review`, or spawn a review subagent) focused on
  correctness, tenant isolation, and the ticket's **acceptance criteria**. Fix real findings and re-verify.

## 7. Commit, push, PR
- Commit with a clear, value-describing message ending with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **CHECKPOINT 2 — show the PR title + body and confirm before pushing** (a PR is outward-facing).
- Push the branch and open the PR with the GitHub CLI (full path
  `"/c/Program Files/GitHub CLI/gh.exe"`). PR body: what & why, a link to the ClickUp ticket
  (`https://app.clickup.com/t/<id>`), how it was verified, and end with:
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

## 8. Close the loop
- Comment the PR URL on the ClickUp ticket. Leave the ticket **in progress** (or a review status) until
  the PR merges — do **not** mark it complete before merge.
- Run the `/compound` capture routine (report + any durable learning), since source changed.
- Report back to the user: the branch name, the PR URL, the ticket link, and what was verified.
