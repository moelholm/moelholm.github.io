CREATE TABLE IF NOT EXISTS post_likes (
  slug TEXT PRIMARY KEY,
  likes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS post_voters (
  slug TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (slug, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_post_voters_rate_limit
  ON post_voters (voter_hash, created_at);
