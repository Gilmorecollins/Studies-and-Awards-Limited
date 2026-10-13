-- Activity log, newsletter sign-ups. Already applied; kept as a record.
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS audit_log_at ON audit_log (at);
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  at TEXT NOT NULL
);
