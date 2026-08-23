#!/usr/bin/env bash
#
# First-run setup for a fresh clone: creates the two env files both apps need at
# startup. Idempotent and non-destructive — an existing file is never overwritten,
# so this is safe to re-run.
#
#   ./scripts/dev-setup.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
created=0
existing=0

# Values still carrying their .env.example placeholder, which the apps cannot use.
PLACEHOLDER_PATTERN='^[A-Z_]+="?your-'

copy_env() {
  local example="$1" target="$2" label="$3"

  if [[ ! -f "$example" ]]; then
    echo "  ✗ $label — $example is missing; cannot continue" >&2
    return 1
  fi

  if [[ -f "$target" ]]; then
    echo "  • $label already exists, left untouched"
    existing=$((existing + 1))
  else
    cp "$example" "$target"
    echo "  ✓ $label created from $(basename "$example")"
    created=$((created + 1))
  fi

  # Report unfilled placeholders whether we just created the file or not — a file
  # copied on an earlier run and never filled in is the more confusing failure.
  local unfilled
  unfilled="$(grep -oE "$PLACEHOLDER_PATTERN[^\"]*" "$target" | sed 's/=.*//' | sort -u || true)"
  if [[ -n "$unfilled" ]]; then
    echo "      still needs real values:"
    while IFS= read -r key; do
      [[ -n "$key" ]] && echo "        - $key"
    done <<< "$unfilled"
  fi
}

echo "Setting up env files for a fresh clone…"
copy_env "$ROOT/backend/.env.example"  "$ROOT/backend/.env"        "backend/.env"
copy_env "$ROOT/frontend/.env.example" "$ROOT/frontend/.env.local" "frontend/.env.local"

echo
echo "Created $created file(s); $existing already present."
echo
echo "Next:"
echo "  1. Fill in any values listed above (Supabase keys come from the Supabase dashboard)."
echo "  2. docker compose up -d          # local Postgres on :5432"
echo "  3. cd backend  && npm install && npm run generate && npm run migrate && npm run dev"
echo "  4. cd frontend && npm install && npm run dev"
echo
echo "Note: both apps read their env files only at startup — restart them after any change."
