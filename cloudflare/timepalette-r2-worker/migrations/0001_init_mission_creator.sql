-- TimePalette D1 Mission Creator v1. Initial schema, no imported user data.
-- Source Google Sheets remain the source of truth until verification and cutover.
-- Do not insert PINs or plain-text invite tokens into D1.

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','teacher')),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  legacy_invite_hash TEXT,
  legacy_pin_hash TEXT,
  auth_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_teachers_role_active ON teachers(role,active);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  country_iso TEXT NOT NULL CHECK(length(country_iso)=2),
  country_name TEXT NOT NULL DEFAULT '',
  domain TEXT NOT NULL CHECK(domain IN ('place','time','language','lifeCulture','japanConnection','thinkConnect')),
  type TEXT NOT NULL CHECK(type IN ('text4','photo4','photo1','photoText4','free','web')),
  prompt TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  choices_json TEXT NOT NULL DEFAULT '[]',
  sources_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  author_id TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','needs_revision','approved','published','deleted')),
  review_note TEXT NOT NULL DEFAULT '',
  created_at TEXT,
  updated_at TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1)
);
CREATE INDEX IF NOT EXISTS idx_questions_public ON questions(country_iso,domain,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_questions_author_status ON questions(author_id,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_questions_status_updated ON questions(status,updated_at);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 4),
  legacy_drive_file_id TEXT,
  file_name TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK(size_bytes>=0),
  r2_object_key TEXT,
  r2_sha256 TEXT,
  r2_status TEXT NOT NULL DEFAULT 'pending' CHECK(r2_status IN ('pending','ready','failed','retired')),
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(question_id,slot)
);
CREATE INDEX IF NOT EXISTS idx_media_migration ON media(r2_status,question_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_object_key ON media(r2_object_key) WHERE r2_object_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS progress (
  key TEXT PRIMARY KEY,
  country_iso TEXT NOT NULL CHECK(length(country_iso)=2),
  domain TEXT NOT NULL CHECK(domain IN ('place','time','language','lifeCulture','japanConnection','thinkConnect')),
  manual_done INTEGER NOT NULL DEFAULT 0 CHECK(manual_done BETWEEN 0 AND 10),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS publication_log (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK(action IN ('publish','unpublish')),
  admin_id TEXT NOT NULL DEFAULT '',
  rights_basis TEXT NOT NULL DEFAULT '',
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_publication_history ON publication_log(question_id,created_at);

CREATE TABLE IF NOT EXISTS publication_order (
  key TEXT PRIMARY KEY,
  question_ids_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT
);

-- Short-lived sessions will be stored as token hashes (never raw session tokens).
-- New authentication will be implemented before switching to D1.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

-- Import bookkeeping allows resumable, verified copies without duplicate records.
CREATE TABLE IF NOT EXISTS migration_runs (
  run_id TEXT PRIMARY KEY,
  source_tag TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'started',
  source_counts_json TEXT NOT NULL DEFAULT '{}',
  imported_counts_json TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT
);

-- Later migration adds draft revisions to permit editing while a live version stays online.
-- In this first step publication stays on the Google-backed application.
