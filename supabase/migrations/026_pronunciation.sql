-- Migration 026: Pronunciation Backend Infrastructure
-- Adds l1_language + target_accent to profiles
-- Creates pronunciation_progress table + increment RPC

-- ── Profile columns ─────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS l1_language text DEFAULT NULL
  CHECK (l1_language IN ('german', 'english'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_accent text DEFAULT 'castilian'
  CHECK (target_accent IN ('castilian', 'latin_american'));

-- ── Pronunciation progress table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pronunciation_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('stress','fluency','prosody','rr','x','ɲ','vowels','consonants')),
  attempt_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  last_practiced timestamptz,
  UNIQUE (user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_pronunciation_progress_user
  ON pronunciation_progress (user_id);

ALTER TABLE pronunciation_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pronunciation progress"
  ON pronunciation_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pronunciation progress"
  ON pronunciation_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pronunciation progress"
  ON pronunciation_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Increment RPC ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_pronunciation_progress(
  p_user_id uuid,
  p_category text,
  p_correct boolean
) RETURNS void AS $$
BEGIN
  INSERT INTO pronunciation_progress (user_id, category, attempt_count, correct_count, last_practiced)
  VALUES (p_user_id, p_category, 1, CASE WHEN p_correct THEN 1 ELSE 0 END, now())
  ON CONFLICT (user_id, category) DO UPDATE SET
    attempt_count = pronunciation_progress.attempt_count + 1,
    correct_count = pronunciation_progress.correct_count + CASE WHEN p_correct THEN 1 ELSE 0 END,
    last_practiced = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
