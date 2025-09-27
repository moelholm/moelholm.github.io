#!/usr/bin/env bash
set -euo pipefail

# Minimal wrapper for fetch_strava_activities.py
# Intentionally simple: requires STRAVA_ACCESS_TOKEN to be set already.

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

usage() {
  cat <<'USAGE'
Usage: ./fetch-activities.sh [--limit N]

Environment:
  STRAVA_ACCESS_TOKEN  (required) Strava API access token
  STRAVA_LIMIT         Optional override for number of activities (default 10)
USAGE
}

: "${STRAVA_LIMIT:=10}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --limit)
      STRAVA_LIMIT=${2:-}; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "${STRAVA_ACCESS_TOKEN:-}" ]]; then
  echo "Error: STRAVA_ACCESS_TOKEN is required." >&2
  exit 2
fi

echo "Running fetch_strava_activities.py (limit=${STRAVA_LIMIT})"
STRAVA_ACCESS_TOKEN=${STRAVA_ACCESS_TOKEN} \
STRAVA_LIMIT=${STRAVA_LIMIT} \
python3 fetch_strava_activities.py
echo "Done."
