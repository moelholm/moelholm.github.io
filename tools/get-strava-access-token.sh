#!/usr/bin/env bash
set -euo pipefail

# Wrapper that prints a Strava access token to stdout.
# Assumes AWS credentials already exported / provided (e.g. via OIDC in CI or local profile export).
# Usage:
#   ./tools/get-strava-access-token.sh                  # prints token
#   TOKEN=$(./tools/get-strava-access-token.sh)         # capture
#   ./tools/get-strava-access-token.sh --json           # full JSON
#   ./tools/get-strava-access-token.sh --debug --json   # debug + JSON

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY_SCRIPT="$SCRIPT_DIR/strava_token.py"

if [[ ! -x "$PY_SCRIPT" ]]; then
  chmod +x "$PY_SCRIPT" || true
fi

# Require AWS_SSM_APP_PATH
if [[ -z "${AWS_SSM_APP_PATH:-}" ]]; then
  echo "ERROR: AWS_SSM_APP_PATH environment variable not set (expected something like /APPLICATION/MY_APP)" >&2
  exit 5
fi

python3 "$PY_SCRIPT" "$@"
