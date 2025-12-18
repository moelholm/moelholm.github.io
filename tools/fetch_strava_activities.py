#!/usr/bin/env python3
"""Fetch recent Strava activities and generate site collection entries.

What it does:
    * Fetches the authenticated athlete's most recent activities (page 1 of /athlete/activities).
    * Skips walking activities.
    * Applies a hard cap (STRAVA_LIMIT) on how many activities are processed.
    * For each activity: fetches detailed data and associated photos via
                /activities/{id}/photos?size=5000&per_page=50&photo_sources=true
    * Selects the largest non-placeholder photo for up to STRAVA_PHOTO_MAX photos, stores both a large
        and a thumbnail version under: site/assets/activities_media/<activity_id>/
    * Writes a Markdown file in blog_collections/_activities with YAML front matter containing:
                id, date (UTC ISO), name, sport_type, distance_m, elevation_gain_m,
                moving_time_s, elapsed_time_s, remote_url, optional kudos_count, optional description, media[]
    * Media list entries have local paths for thumb and large plus alt text.
    * Finalizes the collection atomically (temp dir swap) using AtomicDirWriter.

Environment variables:
    STRAVA_ACCESS_TOKEN   (required) OAuth token with at least activity:read scope
    STRAVA_LIMIT          (optional, default 10) max number of activities to keep
    STRAVA_PHOTO_MAX      (optional, default 6) max photos saved per activity
    STRAVA_THUMB_WIDTH    (optional, default 400) thumbnail width in pixels

Output structure:
    site/blog_collections/_activities/<YYYY-MM-DD>-<activity_id>.md
    site/assets/activities_media/<activity_id>/thumb_<n>.jpg, large_<n>.jpg

Exit codes:
    0 success
    2 missing STRAVA_ACCESS_TOKEN
    3 fetch error
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Dict, List
import requests
from io import BytesIO
from PIL import Image
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
PHOTO_MAX = int(os.environ.get("STRAVA_PHOTO_MAX", "6"))
THUMB_WIDTH = int(os.environ.get("STRAVA_THUMB_WIDTH", "400"))


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


def download_activity_photos_simple(token: str, act_id: str, alt_text: str, media_root: Path) -> List[Dict[str, str]]:
    """Fetch and store activity photos in the simplest possible way.

    1. Call /activities/{id}/photos?size=5000&per_page=50
    2. For each photo object, pick the largest numeric URL in item['urls'].
    3. Skip placeholders (contain 'placeholder-photo').
    4. Download large image locally (large_<n>.jpg)
    5. Generate thumbnail (thumb_<n>.jpg) scaled to THUMB_WIDTH preserving aspect.
    6. Return list of media dicts suitable for front matter.
    """
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    endpoint = f"{API_BASE}/activities/{act_id}/photos"
    params = {"size": 5000, "per_page": 50, "photo_sources": "true"}
    try:
        resp = requests.get(endpoint, headers=headers, params=params, timeout=30)
    except Exception as e:
        debug(f"Activity {act_id}: photo request failed: {e}")
        return []
    if resp.status_code != 200:
        debug(f"Activity {act_id}: photo request status {resp.status_code}")
        return []
    try:
        items = resp.json()
    except Exception:
        debug(f"Activity {act_id}: invalid JSON in photo response")
        return []
    if not isinstance(items, list):
        debug(f"Activity {act_id}: photos response not list")
        return []

    media_dir = media_root / act_id
    media_dir.mkdir(parents=True, exist_ok=True)

    media_entries: List[Dict[str, str]] = []
    count = 0
    for item in items:
        if count >= PHOTO_MAX:
            break
        if not isinstance(item, dict):
            continue
        urls_dict = item.get("urls") or {}
        if not isinstance(urls_dict, dict):
            continue
        # Pick largest numeric key
        best_url = None
        try:
            sorted_urls = sorted(
                (
                    (int(k), v) for k, v in urls_dict.items() if isinstance(k, str) and isinstance(v, str)
                ),
                key=lambda kv: kv[0],
                reverse=True,
            )
            if sorted_urls:
                best_url = sorted_urls[0][1]
        except Exception:
            # fallback: take any string value
            for v in urls_dict.values():
                if isinstance(v, str):
                    best_url = v
                    break
        if not best_url or "placeholder-photo" in best_url:
            continue
        # Download large
        try:
            img_resp = requests.get(best_url, timeout=30)
            if img_resp.status_code != 200:
                continue
            data = img_resp.content
            if len(data) < 1000:
                continue
            # Load with PIL (even if already JPEG) to normalize & allow thumbnail
            img = Image.open(BytesIO(data)).convert("RGB")
            large_name = f"large_{count+1}.jpg"
            large_path = media_dir / large_name
            img.save(large_path, "JPEG", quality=88, optimize=True)

            # Thumbnail
            ratio = THUMB_WIDTH / float(img.width)
            new_size = (THUMB_WIDTH, max(1, int(img.height * ratio))) if img.width > THUMB_WIDTH else (img.width, img.height)
            thumb_img = img.resize(new_size) if img.width > THUMB_WIDTH else img
            thumb_name = f"thumb_{count+1}.jpg"
            thumb_path = media_dir / thumb_name
            thumb_img.save(thumb_path, "JPEG", quality=82, optimize=True)

            media_entries.append({
                "thumb": f"/assets/activities_media/{act_id}/{thumb_name}",
                "url": f"/assets/activities_media/{act_id}/{large_name}",
                "alt": alt_text,
            })
            count += 1
        except Exception as e:
            debug(f"Activity {act_id}: failed to process image: {e}")
            continue

    debug(f"Activity {act_id}: saved {len(media_entries)} photos (simple mode)")
    return media_entries


def write_activity_file(token: str, out_dir: Path, media_root: Path, activity: Dict[str, Any], detail: Dict[str, Any]):
    act_id = str(activity.get("id"))
    start_dt = iso_utc(str(activity.get("start_date")))
    date_prefix = start_dt.date().isoformat()
    name = str(activity.get("name", ""))
    sport_type = str(activity.get("sport_type", activity.get("type", "")))
    distance = activity.get("distance", 0)
    moving_time = activity.get("moving_time", 0)
    elapsed_time = activity.get("elapsed_time", 0)
    elev_gain = detail.get("total_elevation_gain") or activity.get("total_elevation_gain") or 0
    url = f"https://www.strava.com/activities/{act_id}" if act_id else ""
    description = str(detail.get("description") or "").strip()
    kudos_count = detail.get("kudos_count") or activity.get("kudos_count") or 0

    stored_media = download_activity_photos_simple(token, act_id, name, media_root)

    fm_lines = [
        "---",
        f"id: \"{act_id}\"",
        f"date: \"{start_dt.isoformat()}\"",
        f"name: \"{name.replace('\\"', "'")}\"",
        f"sport_type: {sport_type}",
    f"distance_m: {distance}",
        f"elevation_gain_m: {elev_gain}",
        f"moving_time_s: {moving_time}",
    f"elapsed_time_s: {elapsed_time}",
        f"remote_url: \"{url}\"",
    ]
    if kudos_count > 0:
        fm_lines.append(f"kudos_count: {kudos_count}")
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
