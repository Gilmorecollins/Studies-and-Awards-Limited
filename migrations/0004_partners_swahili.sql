-- Swahili versions of edited words, and edits to the partner institution lists.
-- Already applied; kept as a record.
ALTER TABLE content ADD COLUMN sw TEXT;
CREATE TABLE IF NOT EXISTS partner_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  key TEXT NOT NULL,          -- o:<name in the files> or n:<id> for one added here
  name TEXT,
  courses TEXT,               -- JSON list
  removed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  updated_by TEXT,
  UNIQUE (country, city, key)
);
