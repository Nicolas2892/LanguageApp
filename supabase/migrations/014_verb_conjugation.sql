-- Migration 014: Verb Conjugation Feature
-- Run once in Supabase SQL editor

-- Verb reference data
CREATE TABLE verbs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infinitive     text NOT NULL UNIQUE,
  english        text NOT NULL,
  frequency_rank integer NOT NULL,
  verb_group     text NOT NULL,       -- 'ar' | 'er' | 'ir' | 'irregular'
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE verbs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verbs_public_read" ON verbs FOR SELECT USING (true);
CREATE INDEX idx_verbs_rank ON verbs (frequency_rank);

-- In-context sentences: 3 per verb+tense, different pronouns
CREATE TABLE verb_sentences (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verb_id      uuid NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
  tense        text NOT NULL,
  pronoun      text NOT NULL,        -- 'yo' | 'tu' | 'el' | 'nosotros' | 'vosotros' | 'ellos'
  sentence     text NOT NULL,        -- full sentence with '_____' blank token
  correct_form text NOT NULL,
  tense_rule   text NOT NULL,        -- short rule shown on incorrect feedback
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE verb_sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verb_sentences_public_read" ON verb_sentences FOR SELECT USING (true);
CREATE INDEX idx_verb_sentences_combo ON verb_sentences (verb_id, tense);

-- User verb favorites
CREATE TABLE user_verb_favorites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verb_id    uuid NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, verb_id)
);
ALTER TABLE user_verb_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_owner" ON user_verb_favorites FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_favorites_user ON user_verb_favorites (user_id);

-- Per-user accuracy tracking (user × verb × tense)
CREATE TABLE verb_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verb_id         uuid NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
  tense           text NOT NULL,
  attempt_count   integer NOT NULL DEFAULT 0,
  correct_count   integer NOT NULL DEFAULT 0,
  last_practiced  timestamptz,
  UNIQUE (user_id, verb_id, tense)
);
ALTER TABLE verb_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verb_progress_owner" ON verb_progress FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_verb_progress_user ON verb_progress (user_id);

-- Atomic upsert RPC
CREATE OR REPLACE FUNCTION increment_verb_progress(
  p_user_id uuid, p_verb_id uuid, p_tense text, p_correct boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO verb_progress (user_id, verb_id, tense, attempt_count, correct_count, last_practiced)
    VALUES (p_user_id, p_verb_id, p_tense,
            1, CASE WHEN p_correct THEN 1 ELSE 0 END, now())
  ON CONFLICT (user_id, verb_id, tense) DO UPDATE SET
    attempt_count  = verb_progress.attempt_count + 1,
    correct_count  = verb_progress.correct_count + CASE WHEN p_correct THEN 1 ELSE 0 END,
    last_practiced = now();
END;
$$;
