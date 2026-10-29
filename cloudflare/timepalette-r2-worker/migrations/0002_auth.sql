-- TimePalette-only D1 auth; no Google credentials or secrets are imported.
ALTER TABLE teachers ADD COLUMN password_salt TEXT;
ALTER TABLE teachers ADD COLUMN password_hash TEXT;
ALTER TABLE teachers ADD COLUMN password_iterations INTEGER NOT NULL DEFAULT 180000;
CREATE TABLE IF NOT EXISTS enrollments (
 token_hash TEXT PRIMARY KEY,
 teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_enrollments_teacher ON enrollments(teacher_id,expires_at);
CREATE TABLE IF NOT EXISTS login_failures (
 account_key TEXT PRIMARY KEY,
 count INTEGER NOT NULL DEFAULT 0,
 expires_at TEXT NOT NULL
);
-- Existing names are not unique. Stable login IDs preserve distinct teacher identities.
ALTER TABLE teachers ADD COLUMN login_id TEXT;
UPDATE teachers SET login_id = substr(replace(id,'-',''),1,12) WHERE login_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_login_id ON teachers(login_id);
