#!/usr/bin/env python3
"""
Fetch latest Mastodon toots by tag and regenerate a fresh toots set.

Behavior:
 - Generates into blog_collections/_toots.tmp first, then atomically replaces blog_collections/_toots
 - For each tag in TAGS, fetch up to LIMIT own statuses using Mastodon API
 - Convert toot HTML to Markdown
 - Write one file per toot at blog_collections/_toots/YYYY-MM-DD-<toot_id>.md with YAML front matter
     fields: id, date (UTC, ISO-like with offset), tag, and remote_url

Configuration via env vars:
 - MASTODON_INSTANCE, MASTODON_USER_ID, MASTODON_TAGS (comma-separated), MASTODON_LIMIT, MASTODON_MODE
 - The Mastodon access token is read from env var MASTODON_TOKEN

Notes:
 - Boosts (reblogs) are excluded; replies are included.
 - If a toot matches multiple tags, the first encountered tag is used (deduplicated by toot id).
 - No git operations here; CI or caller handles commits/PRs.
"""

from __future__ import annotations

import os
import sys
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Set
from urllib.parse import urlparse

import requests
import html2text


# ----------------------
# Parameters (can be overridden via env vars)
# ----------------------
INSTANCE = os.environ.get("MASTODON_INSTANCE", "https://mastodon.social").rstrip("/")
USER_ID = os.environ.get("MASTODON_USER_ID", "")
TAGS = [
    t.strip() for t in os.environ.get("MASTODON_TAGS", "running,ultrarunning,trailrunning").split(",") if t.strip()
]
LIMIT = int(os.environ.get("MASTODON_LIMIT", "10"))
MODE = os.environ.get("MASTODON_MODE", "global").strip().lower()  # per_tag | global


# ----------------------
# Helpers
# ----------------------
def debug(msg: str) -> None:
    print(f"[fetch_toots] {msg}")


def iso_utc(dt_str: str) -> datetime:
    """Parse Mastodon created_at to UTC-aware datetime (seconds precision)."""
    s = dt_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).replace(microsecond=0)


def to_markdown(html: str) -> str:
    """Convert toot HTML to Markdown using html2text."""
    conv = html2text.HTML2Text()
    conv.body_width = 0
    conv.ignore_emphasis = False
    conv.ignore_links = False
    conv.ignore_images = False
    conv.inline_links = True
    conv.wrap_links = False
    md = conv.handle(html or "").strip()
    return md


# ----------------------
# Core logic
# ----------------------
def fetch_statuses(token: str, instance: str, user_id: str, tag: str, limit: int) -> List[Dict[str, Any]]:
    url = f"{instance}/api/v1/accounts/{user_id}/statuses"
    params = {
        "limit": str(limit),
        "tagged": tag,
        "exclude_reblogs": "true",
    }
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    resp = requests.get(url, headers=headers, params=params, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"HTTP {resp.status_code} when fetching statuses for tag '{tag}': {resp.text[:200]}")
    data = resp.json()
    if not isinstance(data, list):
        raise RuntimeError(f"Unexpected response for tag '{tag}': {json.dumps(data)[:200]}")
    return data


def write_toot_file(out_dir: Path, toot: Dict[str, Any], tag: str) -> Path:
    toot_id = str(toot.get("id"))
    created_at = iso_utc(str(toot.get("created_at")))
    url = str(toot.get("url", ""))
    body_md = to_markdown(str(toot.get("content", "")))
    hashtags = [str(t.get("name")) for t in (toot.get("tags") or []) if isinstance(t, dict) and t.get("name")]
    # Determine instance base from the toot's remote URL
    instance_base = ""
    try:
        u = urlparse(url)
        if u.scheme and u.netloc:
            instance_base = f"{u.scheme}://{u.netloc}"
    except Exception:
        instance_base = INSTANCE

    date_prefix = created_at.date().isoformat()
    path = out_dir / f"{date_prefix}-{toot_id}.md"

    fm_lines = [
        "---",
        f"id: \"{toot_id}\"",
        f"date: \"{created_at.isoformat()}\"",
        f"tag: {tag}",
        f"remote_url: \"{url}\"",
        f"instance_base: \"{instance_base}\"",
        "hashtags:",
    ]
    for h in hashtags:
        fm_lines.append(f"  - {h}")
    fm_lines += [
        "---",
        "",
    ]
    content = "\n".join(fm_lines) + body_md + "\n"
    path.write_text(content, encoding="utf-8")
    return path


def main() -> int:
    token = os.environ.get("MASTODON_TOKEN")
    if not token:
        print("MASTODON_TOKEN is required", file=sys.stderr)
        return 2
    if not USER_ID:
        print("USER_ID is empty. Set USER_ID via env var MASTODON_USER_ID.", file=sys.stderr)
        return 2

    repo_root = Path(__file__).resolve().parent
    collections_root = repo_root / "blog_collections"
    out_dir = collections_root / "_toots"
    tmp_dir = collections_root / "_toots.tmp"

    # Prepare a clean temporary directory for safe generation
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    # Fetch and write
    total_written = 0
    if MODE == "global":
        id_to_status: Dict[str, Dict[str, Any]] = {}
        id_to_tag: Dict[str, str] = {}
        for tag in TAGS:
            debug(f"[global] Fetching up to {LIMIT} statuses for tag='{tag}' from {INSTANCE} (user_id={USER_ID})")
            try:
                items = fetch_statuses(token, INSTANCE, USER_ID, tag, LIMIT)
            except Exception as e:
                print(f"Error fetching tag '{tag}': {e}", file=sys.stderr)
                continue
            for st in items:
                if st.get("reblog"):
                    continue
                tid = str(st.get("id"))
                if tid not in id_to_status:
                    id_to_status[tid] = st
                    id_to_tag[tid] = tag

        sorted_statuses = sorted(
            id_to_status.values(), key=lambda s: iso_utc(str(s.get("created_at", ""))), reverse=True
        )
        for st in sorted_statuses[:LIMIT]:
            tag = id_to_tag.get(str(st.get("id")), TAGS[0] if TAGS else "")
            write_toot_file(tmp_dir, st, tag)
            total_written += 1
    else:
        seen: Set[str] = set()
        for tag in TAGS:
            debug(f"[per_tag] Fetching up to {LIMIT} statuses for tag='{tag}' from {INSTANCE} (user_id={USER_ID})")
            try:
                items = fetch_statuses(token, INSTANCE, USER_ID, tag, LIMIT)
            except Exception as e:
                print(f"Error fetching tag '{tag}': {e}", file=sys.stderr)
                continue
            count_for_tag = 0
            for st in items:
                if st.get("reblog"):
                    continue
                toot_id = str(st.get("id"))
                if toot_id in seen:
                    continue
                write_toot_file(tmp_dir, st, tag)
                seen.add(toot_id)
                total_written += 1
                count_for_tag += 1
                if count_for_tag >= LIMIT:
                    break

    # Write metadata file into tmp_dir so it becomes part of the atomic replacement
    meta_path = tmp_dir / "meta.md"
    now_utc = datetime.now(timezone.utc).replace(microsecond=0)
    meta_lines = [
        "---",
        "is_meta: true",
        f"updated_at: \"{now_utc.isoformat()}\"",
        f"items: {total_written}",
        "---",
        "",
    ]
    meta_path.write_text("\n".join(meta_lines), encoding="utf-8")

    debug(f"Prepared {total_written} toot files in temporary directory {tmp_dir}")

    # Only replace current set if we actually produced content
    if total_written > 0:
        if out_dir.exists():
            debug(f"Replacing existing directory {out_dir} with freshly generated content")
            shutil.rmtree(out_dir)
        tmp_dir.rename(out_dir)
        debug(f"Wrote {total_written} toot files to {out_dir}")
    else:
        debug("No toot files produced; keeping existing content and removing temp directory")
        shutil.rmtree(tmp_dir)

    debug("Generation complete; CI will handle commit/PR if needed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
