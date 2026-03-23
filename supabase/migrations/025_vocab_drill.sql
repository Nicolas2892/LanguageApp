-- Feat-M: Vocabulary Drill Mode
-- Tables: vocab_items, vocab_sentences, vocab_progress
-- RPC: increment_vocab_progress

-- vocab_items (analogous to verbs)
CREATE TABLE vocab_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expression      text NOT NULL UNIQUE,
  english         text NOT NULL,
  category        text NOT NULL CHECK (category IN (
    'discourse_markers','fixed_phrases','collocations','register_phrases',
    'idiomatic','prepositional','adverbial','pragmatic'
  )),
  level           text NOT NULL DEFAULT 'B2' CHECK (level IN ('B1','B2','C1')),
  frequency_rank  integer NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vocab_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vocab_items_public_read" ON vocab_items FOR SELECT USING (true);
CREATE INDEX idx_vocab_items_category ON vocab_items (category);
CREATE INDEX idx_vocab_items_level ON vocab_items (level);

-- vocab_sentences (analogous to verb_sentences)
CREATE TABLE vocab_sentences (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vocab_id         uuid NOT NULL REFERENCES vocab_items(id) ON DELETE CASCADE,
  sentence         text NOT NULL,
  correct_form     text NOT NULL,
  answer_variants  text[] DEFAULT NULL,
  english          text NOT NULL,
  hint             text DEFAULT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vocab_sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vocab_sentences_public_read" ON vocab_sentences FOR SELECT USING (true);
CREATE INDEX idx_vocab_sentences_vocab ON vocab_sentences (vocab_id);

-- vocab_progress (analogous to verb_progress, but per-item not per-item+tense)
CREATE TABLE vocab_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocab_id        uuid NOT NULL REFERENCES vocab_items(id) ON DELETE CASCADE,
  attempt_count   integer NOT NULL DEFAULT 0,
  correct_count   integer NOT NULL DEFAULT 0,
  last_practiced  timestamptz,
  UNIQUE (user_id, vocab_id)
);
ALTER TABLE vocab_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vocab_progress_owner" ON vocab_progress FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_vocab_progress_user ON vocab_progress (user_id);

-- Atomic upsert RPC
CREATE OR REPLACE FUNCTION increment_vocab_progress(
  p_user_id uuid, p_vocab_id uuid, p_correct boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO vocab_progress (user_id, vocab_id, attempt_count, correct_count, last_practiced)
    VALUES (p_user_id, p_vocab_id, 1, CASE WHEN p_correct THEN 1 ELSE 0 END, now())
  ON CONFLICT (user_id, vocab_id) DO UPDATE SET
    attempt_count  = vocab_progress.attempt_count + 1,
    correct_count  = vocab_progress.correct_count + CASE WHEN p_correct THEN 1 ELSE 0 END,
    last_practiced = now();
END;
$$;
