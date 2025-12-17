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
from pathlib import Path
from typing import List, Dict, Any, Set
from urllib.parse import urlparse

import requests
import html2text
from collection_utils import (
    debug as util_debug,
    iso_utc,
    AtomicDirWriter,
    write_meta_file,
    safe_filename_from_url,
    download_file,
)


# ----------------------
# Parameters (can be overridden via env vars)
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
NAMESPACE = "fetch_toots"

def debug(msg: str) -> None:
    util_debug(NAMESPACE, msg)
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


# media helpers now provided by collection_utils (safe_filename_from_url, download_file)


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


def write_toot_file(out_dir: Path, media_root: Path, toot: Dict[str, Any], tag: str) -> Path:
    toot_id = str(toot.get("id"))
    created_at = iso_utc(str(toot.get("created_at")))
    url = str(toot.get("url", ""))
    body_md = to_markdown(str(toot.get("content", "")))
    hashtags = [str(t.get("name")) for t in (toot.get("tags") or []) if isinstance(t, dict) and t.get("name")]
    favourites_count = int(toot.get("favourites_count", 0))
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
        f"favourites_count: {favourites_count}",
        "hashtags:",
    ]
    for h in hashtags:
        fm_lines.append(f"  - {h}")
    # Media attachments: download preview thumbnails into media_root/<id>/ and expose in front matter
    attachments = toot.get("media_attachments") or []
    media_items: list[dict] = []
    if attachments:
        media_dir = media_root / toot_id
        for att in attachments:
            thumb_url = str(att.get("preview_url") or att.get("url") or "").strip()
            full_url = str(att.get("url") or "").strip()
            alt = str(att.get("description") or "").strip()
            if not thumb_url:
                continue
            fname = safe_filename_from_url(thumb_url)
            try:
                download_file(thumb_url, media_dir / fname)
            except Exception:
                continue
            media_items.append({
                "thumb": f"/assets/toots_media/{toot_id}/{fname}",
                "url": full_url or thumb_url,
                "alt": alt,
            })
    if media_items:
        fm_lines.append("media:")
        for m in media_items:
            fm_lines.append(f"  - thumb: \"{m['thumb']}\"")
            fm_lines.append(f"    url: \"{m['url']}\"")
            if m.get("alt"):
                fm_lines.append(f"    alt: \"{m['alt'].replace('\\"', "'")}\"")

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

    repo_root = Path(__file__).resolve().parents[1]
    site_root = repo_root / "site"
    writer = AtomicDirWriter(namespace=NAMESPACE, collection_name="_toots", site_root=site_root, assets_subdir="toots_media")
    writer.prepare()

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
            write_toot_file(writer.tmp_dir, writer.assets_tmp_dir, st, tag)  # type: ignore[arg-type]
            writer.increment()
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
                write_toot_file(writer.tmp_dir, writer.assets_tmp_dir, st, tag)  # type: ignore[arg-type]
                seen.add(toot_id)
                writer.increment()
                count_for_tag += 1
                if count_for_tag >= LIMIT:
                    break

    write_meta_file(writer)
    debug(f"Prepared {writer.produced} toot files in temporary directory {writer.tmp_dir}")
    writer.finalize()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
