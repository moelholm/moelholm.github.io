#!/usr/bin/env python3
"""Local dev emulator for tools/cloudflare-likes/worker.js on port 8787."""
import hashlib
import json
import re
import sqlite3
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

DB_PATH = Path(__file__).parent / ".local-likes.sqlite3"
SCHEMA_PATH = Path(__file__).parent / "schema.sql"
SLUG_RE = re.compile(
    r"^/blog/(running|software_engineering)/\d{4}/\d{2}/\d{2}/[a-z0-9_-]{2,90}$",
    re.I,
)

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.executescript(SCHEMA_PATH.read_text())
conn.commit()


def norm_slug(raw: str | None) -> str | None:
    if not raw:
        return None
    s = re.sub(r"\.html$", "", raw.strip(), flags=re.I).rstrip("/")
    return s if SLUG_RE.match(s) else None


class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True


class Handler(BaseHTTPRequestHandler):
    def _headers(self, status=200):
        origin = self.headers.get("Origin", "*")
        self.send_response(status)
        self.send_header("Content-Type", "application/json;charset=UTF-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _voter_hash(self) -> str:
        ip = self.client_address[0]
        return hashlib.sha256(f"{ip}:local-salt".encode()).hexdigest()

    def do_OPTIONS(self):
        self._headers(204)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path != "/likes":
            self._headers(404)
            self.wfile.write(b'{"error":"Not found"}')
            return
        qs = parse_qs(u.query)
        raw_slug = qs.get("slug", [None])[0]
        if not raw_slug:
            rows = conn.execute("SELECT slug, likes FROM post_likes WHERE likes > 0").fetchall()
            self._headers(200)
            self.wfile.write(json.dumps({"counts": dict(rows)}).encode())
            return
        slug = norm_slug(raw_slug)
        if not slug:
            self._headers(400)
            self.wfile.write(b'{"error":"Invalid slug"}')
            return
        vh = self._voter_hash()
        row = conn.execute("SELECT likes FROM post_likes WHERE slug = ?", (slug,)).fetchone()
        liked = conn.execute(
            "SELECT 1 FROM post_voters WHERE slug = ? AND voter_hash = ?", (slug, vh)
        ).fetchone()
        self._headers(200)
        self.wfile.write(
            json.dumps({"slug": slug, "likes": row[0] if row else 0, "liked": bool(liked)}).encode()
        )

    def do_POST(self):
        u = urlparse(self.path)
        slug = norm_slug(parse_qs(u.query).get("slug", [None])[0])
        if u.path != "/likes" or not slug:
            self._headers(400)
            self.wfile.write(b'{"error":"Invalid slug"}')
            return
        vh = self._voter_hash()
        exists = conn.execute(
            "SELECT 1 FROM post_voters WHERE slug = ? AND voter_hash = ?", (slug, vh)
        ).fetchone()
        if not exists:
            conn.execute("INSERT OR IGNORE INTO post_voters (slug, voter_hash) VALUES (?, ?)", (slug, vh))
            conn.execute(
                "INSERT INTO post_likes (slug, likes) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET likes = likes + 1",
                (slug,),
            )
            liked = True
        else:
            conn.execute("DELETE FROM post_voters WHERE slug = ? AND voter_hash = ?", (slug, vh))
            conn.execute("UPDATE post_likes SET likes = MAX(0, likes - 1) WHERE slug = ?", (slug,))
            liked = False
        conn.commit()
        row = conn.execute("SELECT likes FROM post_likes WHERE slug = ?", (slug,)).fetchone()
        self._headers(200)
        self.wfile.write(
            json.dumps({"slug": slug, "likes": row[0] if row else 0, "liked": liked}).encode()
        )

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    print("👏 Local Cloudflare likes mock running on http://localhost:8787/likes", flush=True)
    ReusableHTTPServer(("0.0.0.0", 8787), Handler).serve_forever()
