-- Additive migration: keep existing D1 questions, images, teachers and publication order.
ALTER TABLE questions ADD COLUMN learning_json TEXT NOT NULL DEFAULT '{}';
