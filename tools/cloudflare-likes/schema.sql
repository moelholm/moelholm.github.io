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

-- One row per voter: counts every toggle request in the current 1-minute window
CREATE TABLE IF NOT EXISTS rate_limits (
  voter_hash TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL
);
