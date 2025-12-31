#!/usr/bin/env python3
"""Shared utilities for generating blog collection content atomically.

Provides helpers used by fetch_toots.py and fetch_strava_activities.py to
avoid duplication (DRY):
 - debug: namespaced logging
 - iso_utc: parse ISO-like timestamps and normalize to UTC
 - AtomicDirWriter: context manager that stages files into a temp directory
   and atomically swaps into place on success (with optional paired assets dir)
 - write_meta_file: standard metadata file writer with updated_at + item count

The AtomicDirWriter handles creation and clean up of temporary directories
and performs an atomic rename replacement only when items were actually
produced.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import shutil
import sys
from typing import Optional, Iterable, List, Dict, Any
from urllib.parse import urlparse
from hashlib import sha1
import requests

__all__ = [
    "debug",
    "iso_utc",
    "AtomicDirWriter",
    "write_meta_file",
    "safe_filename_from_url",
    "download_file",
]


def debug(ns: str, msg: str) -> None:
    print(f"[{ns}] {msg}")


def iso_utc(dt_str: str) -> datetime:
    if not dt_str:
        return datetime.now(timezone.utc).replace(microsecond=0)
    s = dt_str.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        # Fallback: strip fractional seconds if present
        if "." in s:
            base, _, rest = s.partition(".")
            # remove trailing timezone offset part after seconds
            if "+" in rest:
                frac, _, tz = rest.partition("+")
                s2 = base + "+" + tz
            elif "-" in rest:
                frac, _, tz = rest.partition("-")
                s2 = base + "-" + tz
            else:
                s2 = base
            try:
                dt = datetime.fromisoformat(s2)
            except Exception:
                dt = datetime.now(timezone.utc)
        else:
            dt = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).replace(microsecond=0)


@dataclass
class AtomicDirWriter:
    namespace: str
    collection_name: str  # e.g. "_toots" or "_activities"
    site_root: Path
    assets_subdir: Optional[str] = None  # e.g. "toots_media" or "activities_media"

    def __post_init__(self):
        self.collections_root = self.site_root / "blog_collections"
        self.final_dir = self.collections_root / self.collection_name
        self.tmp_dir = self.collections_root / f"{self.collection_name}.tmp"
        self.assets_root = self.site_root / "assets" if self.assets_subdir else None
        if self.assets_root:
            self.assets_final_dir = self.assets_root / self.assets_subdir
            self.assets_tmp_dir = self.assets_root / f"{self.assets_subdir}.tmp"
        else:
            self.assets_final_dir = None
            self.assets_tmp_dir = None
        self._produced = 0

    @property
    def produced(self) -> int:
        return self._produced

    def increment(self, n: int = 1):
        self._produced += n

    def prepare(self):
        if self.tmp_dir.exists():
            shutil.rmtree(self.tmp_dir)
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        if self.assets_tmp_dir:
            if self.assets_tmp_dir.exists():
                shutil.rmtree(self.assets_tmp_dir)
            self.assets_tmp_dir.mkdir(parents=True, exist_ok=True)
        debug(self.namespace, f"Prepared temp directories for {self.collection_name}")

    def finalize(self):
        # Only replace if something was created
        if self._produced <= 0:
            debug(self.namespace, f"No items produced for {self.collection_name}; skipping atomic swap")
            if self.tmp_dir.exists():
                shutil.rmtree(self.tmp_dir)
            if self.assets_tmp_dir and self.assets_tmp_dir.exists():
                shutil.rmtree(self.assets_tmp_dir)
            return
        # Swap collection
        if self.final_dir.exists():
            shutil.rmtree(self.final_dir)
        self.tmp_dir.rename(self.final_dir)
        # Swap assets if present
        if self.assets_tmp_dir and self.assets_final_dir:
            backup = self.assets_root / f"{self.assets_subdir}.backup"
            try:
                # Clean up any existing backup first
                if backup.exists():
                    shutil.rmtree(backup)
                # If assets_final_dir exists, move it to backup
                if self.assets_final_dir.exists():
                    self.assets_final_dir.rename(backup)
                # Rename tmp to final
                self.assets_tmp_dir.rename(self.assets_final_dir)
            finally:
                # Always try to clean up backup directory if it exists
                # backup is guaranteed to be defined since it's created before the try block
                if backup.exists():
                    shutil.rmtree(backup)
        debug(self.namespace, f"Wrote {self._produced} items to {self.final_dir}")

    def meta_path(self) -> Path:
        return self.tmp_dir / "meta.md"


def write_meta_file(writer: AtomicDirWriter):
    now_utc = datetime.now(timezone.utc).replace(microsecond=0)
    content = "\n".join([
        "---",
        "is_meta: true",
        f"updated_at: \"{now_utc.isoformat()}\"",
        f"items: {writer.produced}",
        "---",
        "",
    ])
    writer.meta_path().write_text(content, encoding="utf-8")
    debug(writer.namespace, f"Wrote meta file with {writer.produced} items")


# ----------------------
# Reusable media helpers
# ----------------------
def safe_filename_from_url(u: str, prefix: str = "thumb_") -> str:
    """Generate deterministic short filename from URL (keeps extension if present)."""
    try:
        p = urlparse(u)
        name = Path(p.path).name or "file"
        ext = Path(name).suffix
    except Exception:
        ext = ""
    digest = sha1(u.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}{digest}{ext}"


def download_file(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        with requests.get(url, stream=True, timeout=30) as r:
            r.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        return True
    except Exception:
        return False
