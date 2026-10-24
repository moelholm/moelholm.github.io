#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

DB_NAME="likes-and-more-db"

echo "1) Checking Cloudflare login..."
npx --yes wrangler whoami

echo "2) Ensuring D1 database '$DB_NAME' exists..."
DB_LIST=$(npx --yes wrangler d1 list --json)
DB_ID=$(echo "$DB_LIST" | python3 -c "import sys,json; d=json.load(sys.stdin); print(next((x['uuid'] for x in d if x.get('name')=='$DB_NAME'), ''))")

if [ -z "$DB_ID" ]; then
  echo "   Creating D1 database $DB_NAME..."
  npx --yes wrangler d1 create "$DB_NAME"
  DB_LIST=$(npx --yes wrangler d1 list --json)
  DB_ID=$(echo "$DB_LIST" | python3 -c "import sys,json; d=json.load(sys.stdin); print(next((x['uuid'] for x in d if x.get('name')=='$DB_NAME'), ''))")
fi

echo "   Database ID: $DB_ID"
TMP_CONFIG=".wrangler.deploy.toml"
trap 'rm -f "$TMP_CONFIG"' EXIT
python3 -c "
from pathlib import Path
import re
txt = Path('wrangler.toml').read_text()
txt = re.sub(r'database_id\s*=\s*\"[^\"]+\"', f'database_id = \"$DB_ID\"', txt)
Path('$TMP_CONFIG').write_text(txt)
"

echo "3) Applying SQL schema to remote D1 database..."
npx --yes wrangler d1 execute "$DB_NAME" --config "$TMP_CONFIG" --remote --file=schema.sql

echo "4) Deploying Worker 'likes-and-more'..."
npx --yes wrangler deploy --config "$TMP_CONFIG"

echo "5) Ensuring random LIKE_SALT secret is set in Cloudflare (never stored in git)..."
# Must not swallow errors: a failed list would otherwise overwrite the salt and invalidate all stored votes
SECRET_LIST=$(npx --yes wrangler secret list --config "$TMP_CONFIG")
if ! echo "$SECRET_LIST" | grep -q 'LIKE_SALT'; then
  openssl rand -hex 32 | npx --yes wrangler secret put LIKE_SALT --config "$TMP_CONFIG"
fi

echo "✅ Done! Live at: https://likes-and-more.moelholm.workers.dev/likes"
