#!/usr/bin/env python3
"""Fetch latest Strava activities and generate markdown collection.

Behavior:
 - Fetches the authenticated athlete's most recent activities (page 1) using the Strava API
 - Filters out activities with sport_type == 'Walk'
 - Keeps up to LIMIT items (default 10)
 - Writes files to blog_collections/_activities (atomic via AtomicDirWriter)
 - Produces meta.md with updated_at + item count

Environment:
 - STRAVA_ACCESS_TOKEN (required)
 - STRAVA_LIMIT (optional, default 10)

Output file naming: YYYY-MM-DD-<activity_id>.md
Front matter fields:
 id (string), date (start_date_local in UTC), name, distance_m, moving_time_s,
 elapsed_time_s, sport_type, remote_url

Distance is stored in meters (float) as received.

Dependencies: requests, collection_utils
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Dict, List
import requests
from urllib.parse import urlparse

from collection_utils import (
    debug as util_debug,
    iso_utc,
    AtomicDirWriter,
    write_meta_file,
    safe_filename_from_url,
    download_file,
)

NAMESPACE = "fetch_strava_activities"
API_BASE = "https://www.strava.com/api/v3"
LIMIT = int(os.environ.get("STRAVA_LIMIT", "10"))


def debug(msg: str):
    util_debug(NAMESPACE, msg)


def fetch_activities(token: str, per_page: int = 30) -> List[Dict[str, Any]]:
    url = f"{API_BASE}/athlete/activities"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    params = {"per_page": per_page, "page": 1}
    r = requests.get(url, headers=headers, params=params, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"Strava activities endpoint returned {r.status_code}: {r.text[:200]}")
    data = r.json()
    if not isinstance(data, list):
        raise RuntimeError("Unexpected Strava response (not list)")
    return data


def fetch_activity_detail(token: str, act_id: str) -> Dict[str, Any]:
    url = f"{API_BASE}/activities/{act_id}"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    r = requests.get(url, headers=headers, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"Activity detail {act_id} returned {r.status_code}: {r.text[:120]}")
    data = r.json()
    if not isinstance(data, dict):
        raise RuntimeError("Unexpected detail response (not dict)")
    return data


def write_activity_file(token: str, out_dir: Path, media_root: Path, activity: Dict[str, Any], detail: Dict[str, Any]):
    act_id = str(activity.get("id"))
    start_dt = iso_utc(str(activity.get("start_date")))
    date_prefix = start_dt.date().isoformat()
    name = str(activity.get("name", ""))
    sport_type = str(activity.get("sport_type", activity.get("type", "")))
    distance = activity.get("distance", 0)
    moving_time = activity.get("moving_time", 0)
    elapsed_time = activity.get("elapsed_time", 0)
    url = f"https://www.strava.com/activities/{act_id}" if act_id else ""
    description = str(detail.get("description") or "").strip()

    # Photos extraction
    media_items: List[Dict[str, str]] = []
    photos = detail.get("photos") or {}
    try:
        primary = photos.get("primary") if isinstance(photos, dict) else None
        if primary and isinstance(primary, dict):
            urls = primary.get("urls")
            if isinstance(urls, dict):
                best = None
                for k, v in urls.items():
                    try:
                        size = int(k)
                    except Exception:
                        size = 0
                    if v and (best is None or size > best[0]):
                        best = (size, v)
                if best and isinstance(best[1], str):
                    media_items.append({"thumb_src": best[1], "alt": name})
    except Exception:
        pass

    try:
        if isinstance(photos, dict) and photos.get("count", 0) and photos.get("count", 0) > 1:
            photo_url = f"{API_BASE}/activities/{act_id}/photos"
            r = requests.get(photo_url, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"}, timeout=30)
            if r.status_code == 200:
                arr = r.json()
                if isinstance(arr, list):
                    for ph in arr:
                        try:
                            urls = ph.get("urls") if isinstance(ph, dict) else None
                            if isinstance(urls, dict):
                                best = None
                                for k, v in urls.items():
                                    try:
                                        size = int(k)
                                    except Exception:
                                        size = 0
                                    if v and (best is None or size > best[0]):
                                        best = (size, v)
                                if best and isinstance(best[1], str):
                                    media_items.append({"thumb_src": best[1], "alt": name})
                        except Exception:
                            continue
    except Exception:
        pass

    # Deduplicate + cap
    dedup = []
    seen = set()
    for m in media_items:
        u = m.get("thumb_src")
        if not u or u in seen:
            continue
        seen.add(u)
        dedup.append(m)
    media_items = dedup[:6]

    stored_media: List[Dict[str, str]] = []
    if media_items:
        media_dir = media_root / act_id
        for m in media_items:
            src = m["thumb_src"]
            fname = safe_filename_from_url(src, prefix="act_")
            try:
                download_file(src, media_dir / fname)
            except Exception:
                continue
            stored_media.append({
                "thumb": f"/assets/activities_media/{act_id}/{fname}",
                "url": url,
                "alt": m.get("alt", ""),
            })

    fm_lines = [
        "---",
        f"id: \"{act_id}\"",
        f"date: \"{start_dt.isoformat()}\"",
        f"name: \"{name.replace('\\"', "'")}\"",
        f"sport_type: {sport_type}",
        f"distance_m: {distance}",
        f"moving_time_s: {moving_time}",
        f"elapsed_time_s: {elapsed_time}",
        f"remote_url: \"{url}\"",
    ]
    if description:
        fm_lines.append(f"description: \"{description.replace('\\"', "'")}\"")
    if stored_media:
        fm_lines.append("media:")
        for sm in stored_media:
            fm_lines.append(f"  - thumb: \"{sm['thumb']}\"")
            fm_lines.append(f"    url: \"{sm['url']}\"")
            if sm.get("alt"):
                alt_clean = sm['alt'].replace('"', "'")
                fm_lines.append(f"    alt: \"{alt_clean}\"")
    fm_lines += [
        "---",
        "",
    ]
    path = out_dir / f"{date_prefix}-{act_id}.md"
    path.write_text("\n".join(fm_lines), encoding="utf-8")
    return path


def main() -> int:
    token = os.environ.get("STRAVA_ACCESS_TOKEN")
    if not token:
        print("STRAVA_ACCESS_TOKEN env var is required", file=sys.stderr)
        return 2

    repo_root = Path(__file__).resolve().parents[1]
    site_root = repo_root / "site"
    writer = AtomicDirWriter(namespace=NAMESPACE, collection_name="_activities", site_root=site_root, assets_subdir="activities_media")
    writer.prepare()

    try:
        activities = fetch_activities(token)
    except Exception as e:
        print(f"Error fetching activities: {e}", file=sys.stderr)
        return 3

    kept = 0
    for act in activities:
        if kept >= LIMIT:
            break
        sport_type = str(act.get("sport_type", act.get("type", "")))
        if sport_type.lower() == "walk":
            continue
        try:
            detail = fetch_activity_detail(token, str(act.get("id")))
        except Exception as e:
            debug(f"Detail fetch failed for {act.get('id')}: {e}")
            detail = {}
        write_activity_file(token, writer.tmp_dir, writer.assets_tmp_dir, act, detail)  # type: ignore[arg-type]
        writer.increment()
        kept += 1

    write_meta_file(writer)
    debug(f"Prepared {writer.produced} activity files")
    writer.finalize()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
