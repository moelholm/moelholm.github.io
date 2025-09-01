#!/usr/bin/env bash
set -euo pipefail

# Local helper to run fetch_toots.py.
# - Loads optional ./.env.local (ignored by git) for secrets and config
# - Lets you override via CLI flags

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

usage() {
  cat <<'USAGE'
Usage: ./fetch-toots.sh [options]

Options:
  --instance URL         Mastodon instance base URL (default: https://fosstodon.org)
  --user-id ID           Your Mastodon numeric account ID on that instance
  --limit N              Max number of toots to fetch (default: 10)
  --tags CSV             Comma-separated tags (default: running,ultrarunning,trailrunning)
  --mode per_tag|global  Apply LIMIT per tag or globally (default: global)
  -h, --help             Show this help

Environment variables respected:
  MASTODON_TOKEN         Access token with scopes: read:accounts, read:statuses
  MASTODON_INSTANCE      Overrides --instance
  MASTODON_USER_ID       Overrides --user-id
  MASTODON_LIMIT         Overrides --limit
  MASTODON_TAGS          Overrides --tags (CSV)
  MASTODON_MODE          per_tag|global (default: global)

Tip (Codespaces): GitHub Actions secrets are NOT accessible here.
Set a Codespaces Secret named MASTODON_TOKEN, then it will be available as env var.
Alternatively, create a local .env.local with MASTODON_TOKEN, e.g.:

  echo 'MASTODON_TOKEN=xxxxx' >> .env.local
  echo 'MASTODON_INSTANCE=https://your.instance' >> .env.local
  echo 'MASTODON_USER_ID=12345' >> .env.local
USAGE
}

# Load local env if present
if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  source ./.env.local
fi

# Defaults
: "${MASTODON_LIMIT:=10}"
: "${MASTODON_TAGS:=running,ultrarunning,trailrunning}"
: "${MASTODON_MODE:=global}"
# Default Mastodon instance if not provided via env or CLI
: "${MASTODON_INSTANCE:=https://fosstodon.org}"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --instance)
      # Require a non-empty URL to override the default; don't blank it out
      if [[ $# -lt 2 || -z "${2:-}" || "${2}" == --* ]]; then
        echo "Error: --instance requires a URL (e.g., --instance https://fosstodon.org)" >&2
        exit 2
      fi
      MASTODON_INSTANCE="$2"; shift 2 ;;
    --user-id)
      MASTODON_USER_ID=${2:-}; shift 2 ;;
    --limit)
      MASTODON_LIMIT=${2:-}; shift 2 ;;
    --tags)
      MASTODON_TAGS=${2:-}; shift 2 ;;
    --mode)
      MASTODON_MODE=${2:-}; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage; exit 2 ;;
  esac
done

# Validate token presence
if [[ -z "${MASTODON_TOKEN:-}" ]]; then
  echo "Error: MASTODON_TOKEN is not set." >&2
  echo "- In Codespaces: add a Codespaces Secret named MASTODON_TOKEN." >&2
  echo "- Or create .env.local with MASTODON_TOKEN=..." >&2
  exit 2
fi

# Quick dependency check/install for requests + html2text
if ! python3 - <<'PY' >/dev/null 2>&1; then
import sys
import importlib
missing = []
for m in ("requests", "html2text"):
    try:
        importlib.import_module(m)
    except Exception:
        missing.append(m)
sys.exit(0 if not missing else 1)
PY
  echo "Installing Python dependencies (requests, html2text) to user site..."
  python3 -m pip install --user --quiet --upgrade requests html2text
fi

echo "Running fetch_toots.py (instance: ${MASTODON_INSTANCE})"
MASTODON_LIMIT=${MASTODON_LIMIT} \
MASTODON_TAGS=${MASTODON_TAGS} \
MASTODON_MODE=${MASTODON_MODE} \
MASTODON_INSTANCE=${MASTODON_INSTANCE} \
MASTODON_USER_ID=${MASTODON_USER_ID:-} \
MASTODON_TOKEN=${MASTODON_TOKEN} \
python3 fetch_toots.py

echo "Done. Check the _toots/ folder."
