-- Additive-only migration: preserve all existing TimePalette questions, media and teachers.
ALTER TABLE questions ADD COLUMN author_profile_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE questions ADD COLUMN video_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE questions ADD COLUMN author_profile_verified INTEGER NOT NULL DEFAULT 0;
