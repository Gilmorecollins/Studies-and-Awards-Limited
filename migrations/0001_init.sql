-- The back end's tables (Cloudflare D1, database "studiesandawards").
-- Already applied; kept here as a record and to rebuild the database if needed.
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  detail TEXT CHECK (detail IS NULL OR length(detail) <= 120),
  quote TEXT NOT NULL CHECK (length(trim(quote)) BETWEEN 1 AND 400),
  story TEXT CHECK (story IS NULL OR length(story) <= 1200),
  rating REAL CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5 AND rating * 2 = CAST(rating * 2 AS INTEGER))),
  photo_path TEXT CHECK (photo_path IS NULL OR photo_path GLOB '[a-z0-9-]*.jpg'),
  position INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  consent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  CHECK (published = 0 OR consent = 1)
);
CREATE TABLE IF NOT EXISTS photos (
  path TEXT PRIMARY KEY,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS admins (
  email TEXT PRIMARY KEY,
  salt TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_failures (email TEXT NOT NULL, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS login_failures_email ON login_failures (email, at);
