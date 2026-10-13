-- Website content edited from the admin page, and the pictures uploaded there.
-- Already applied; kept as a record.
CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,       -- '*' = every page, a page like '/about', or 'team:<id>'
  kind TEXT NOT NULL CHECK (kind IN ('text', 'meta', 'alt', 'link', 'image')),
  original TEXT NOT NULL,    -- the wording (or link, or picture path) in the files
  value TEXT NOT NULL,       -- what to show instead
  updated_at TEXT NOT NULL,
  updated_by TEXT,
  UNIQUE (scope, kind, original)
);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL
);
