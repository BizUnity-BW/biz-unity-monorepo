#!/usr/bin/env node
/**
 * Compound-engineering Stop hook.
 *
 * Nudges (blocks ONCE, self-clearing) if source files under backend/src, frontend/src, or
 * backend/prisma changed this session but no fresh implementation report was captured in
 * docs/reports/. Writing a report via /compound makes the newest report newer than the newest
 * source change, which clears the nudge; a later code change re-arms it.
 *
 * Safety: any error → exit 0 with no output. This hook must never break a session.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function allow() {
  // No output + exit 0 = let the session stop normally.
  process.exit(0);
}

try {
  const raw = readStdin();
  let input = {};
  try {
    input = raw ? JSON.parse(raw) : {};
  } catch {
    input = {};
  }

  // Loop guard: if we already blocked once and Claude is stopping again, don't re-block.
  if (input.stop_hook_active === true) allow();

  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const WATCHED = ['backend/src/', 'frontend/src/', 'backend/prisma/'];

  // --- newest mtime among changed watched source files ---
  let porcelain = '';
  try {
    porcelain = execSync('git status --porcelain', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    allow(); // not a git repo / git unavailable → nothing to enforce
  }

  const changedPaths = porcelain
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      let p = line.slice(3); // strip "XY " status prefix
      if (p.includes(' -> ')) p = p.split(' -> ')[1]; // rename → new path
      return p.replace(/^"|"$/g, '').trim(); // unquote if git quoted it
    })
    .filter((p) => WATCHED.some((w) => p.replace(/\\/g, '/').startsWith(w)));

  if (changedPaths.length === 0) allow();

  let newestSource = 0;
  for (const rel of changedPaths) {
    try {
      const m = fs.statSync(path.join(root, rel)).mtimeMs;
      if (m > newestSource) newestSource = m;
    } catch {
      /* deleted file — skip */
    }
  }
  if (newestSource === 0) allow();

  // --- newest mtime among captured reports ---
  const reportsDir = path.join(root, 'docs', 'reports');
  let newestReport = 0;
  try {
    for (const f of fs.readdirSync(reportsDir)) {
      if (!f.endsWith('.md')) continue;
      try {
        const m = fs.statSync(path.join(reportsDir, f)).mtimeMs;
        if (m > newestReport) newestReport = m;
      } catch {
        /* skip */
      }
    }
  } catch {
    newestReport = 0; // no reports dir yet
  }

  if (newestSource > newestReport) {
    const reason =
      'Compound-engineering nudge: you changed source files (backend/src, frontend/src, or ' +
      'backend/prisma) but have not captured an implementation report/learning for this work. ' +
      'Run /compound (see CLAUDE.md → Compound engineering workflow) to write the report and record ' +
      'any learnings before finishing. If the change was trivial and needs no report, say so and stop.';
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    process.exit(0);
  }

  allow();
} catch {
  allow();
}
