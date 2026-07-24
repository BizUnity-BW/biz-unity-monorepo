---
description: Capture the compound-engineering artefacts after an implementation — write the report, record learnings, and update context.
argument-hint: [optional slug or focus, e.g. "customers-crud"]
---

Run the **compound-engineering capture routine** for the work just completed. This is the
`Report → Learn → Update context` half of the loop documented in `CLAUDE.md → Compound engineering
workflow`. Optional focus/slug from the user: `$ARGUMENTS`.

Use the current date (ask the shell if unsure: `date +%F`). Reuse the templates in
`.claude/templates/`. Create any missing directories (`docs/plans/`, `docs/reports/`,
`docs/solutions/<category>/`) on demand. All these paths are gitignored — that is expected.

Do the following, in order:

## 1. Summarize the work
Look at the working diff (`git status --porcelain` and `git diff`) and this conversation. Write a
tight summary of what was implemented or fixed this session, and confirm how it was verified
(tests, a real request, a screenshot). If nothing meaningful changed, say so and stop.

## 2. Write the implementation report
Create `docs/reports/<YYYY-MM-DD>-<slug>-report.md` from `.claude/templates/report.md`, where
`<slug>` is `$ARGUMENTS` if given, otherwise a short kebab-case slug of the work. Fill in: what &
why, files touched, how verified, follow-ups / known gaps, and any linked ClickUp task URL. If a
report for the same slug and date already exists, append a new dated entry instead of overwriting.

## 3. Capture learnings (only if non-obvious)
For each durable lesson (a gotcha, a root cause, a convention decided, a tooling choice):
- **First search `docs/solutions/` for an existing doc on the same topic.** If found, UPDATE it and
  bump `last_updated` — do not create a duplicate.
- Otherwise create `docs/solutions/<category>/<slug>.md` from `.claude/templates/solution.md` with
  YAML frontmatter (`title`, `category`, `tags`, `problem_type`, `created`, `last_updated`).
- For a bug/fix, the body must follow **Symptom / Cause / Fix / Date last verified**.
Skip this step entirely if nothing non-obvious was learned — do not manufacture filler.

## 4. Update the vocabulary glossary
If new domain/project terms appeared, add or refine them in `CONCEPTS.md` at the repo root (create it
from a single-sentence-per-term list if missing). Keep entries one or two lines.

## 5. Update ways of working
Only if a durable convention or workflow changed, update the relevant section of `CLAUDE.md`. Do NOT
restate things already derivable from the code.

## 6. Report back
Print a short bullet list of the files you created/updated (report, any solutions, CONCEPTS.md,
CLAUDE.md), each as a clickable path, so the user can review the captured artefacts.
