-- Migration 027: Unified SRS for verbs + vocab
-- New srs_items table tracks SM-2 state for verb+tense and vocab items
-- Keeps user_progress untouched for grammar concepts

-- ── SRS items table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS srs_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type       text NOT NULL CHECK (item_type IN ('verb', 'vocab')),
  verb_id         uuid REFERENCES verbs(id) ON DELETE CASCADE,
  tense           text,
  vocab_id        uuid REFERENCES vocab_items(id) ON DELETE CASCADE,
  ease_factor     real NOT NULL DEFAULT 2.5,
  interval_days   integer NOT NULL DEFAULT 1,
  due_date        date NOT NULL DEFAULT CURRENT_DATE,
  repetitions     integer NOT NULL DEFAULT 0,
  last_reviewed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT srs_item_fields CHECK (
    (item_type = 'verb' AND verb_id IS NOT NULL AND tense IS NOT NULL AND vocab_id IS NULL) OR
    (item_type = 'vocab' AND vocab_id IS NOT NULL AND verb_id IS NULL AND tense IS NULL)
  ),
  CONSTRAINT srs_items_unique_verb UNIQUE (user_id, verb_id, tense),
  CONSTRAINT srs_items_unique_vocab UNIQUE (user_id, vocab_id)
);

CREATE INDEX IF NOT EXISTS idx_srs_items_user_due
  ON srs_items (user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_srs_items_type
  ON srs_items (user_id, item_type);

-- ── Row Level Security ────────────────────────────────────────────────────

ALTER TABLE srs_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own srs_items"
  ON srs_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own srs_items"
  ON srs_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own srs_items"
  ON srs_items FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Upsert RPCs ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION upsert_verb_srs(
  p_user_id       uuid,
  p_verb_id       uuid,
  p_tense         text,
  p_ease_factor   real,
  p_interval_days integer,
  p_due_date      date,
  p_repetitions   integer
) RETURNS void AS $$
BEGIN
  INSERT INTO srs_items (user_id, item_type, verb_id, tense, ease_factor, interval_days, due_date, repetitions, last_reviewed_at)
  VALUES (p_user_id, 'verb', p_verb_id, p_tense, p_ease_factor, p_interval_days, p_due_date, p_repetitions, now())
  ON CONFLICT (user_id, verb_id, tense)
  DO UPDATE SET
    ease_factor     = EXCLUDED.ease_factor,
    interval_days   = EXCLUDED.interval_days,
    due_date        = EXCLUDED.due_date,
    repetitions     = EXCLUDED.repetitions,
    last_reviewed_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION upsert_vocab_srs(
  p_user_id       uuid,
  p_vocab_id      uuid,
  p_ease_factor   real,
  p_interval_days integer,
  p_due_date      date,
  p_repetitions   integer
) RETURNS void AS $$
BEGIN
  INSERT INTO srs_items (user_id, item_type, vocab_id, ease_factor, interval_days, due_date, repetitions, last_reviewed_at)
  VALUES (p_user_id, 'vocab', p_vocab_id, p_ease_factor, p_interval_days, p_due_date, p_repetitions, now())
  ON CONFLICT (user_id, vocab_id)
  DO UPDATE SET
    ease_factor     = EXCLUDED.ease_factor,
    interval_days   = EXCLUDED.interval_days,
    due_date        = EXCLUDED.due_date,
    repetitions     = EXCLUDED.repetitions,
    last_reviewed_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Batch seed RPC (for seeding SRS items on first encounter) ─────────

CREATE OR REPLACE FUNCTION seed_srs_items(
  p_user_id uuid,
  p_items   jsonb
) RETURNS void AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF item->>'item_type' = 'verb' THEN
      INSERT INTO srs_items (user_id, item_type, verb_id, tense, due_date)
      VALUES (p_user_id, 'verb', (item->>'verb_id')::uuid, item->>'tense', CURRENT_DATE)
      ON CONFLICT (user_id, verb_id, tense) DO NOTHING;
    ELSIF item->>'item_type' = 'vocab' THEN
      INSERT INTO srs_items (user_id, item_type, vocab_id, due_date)
      VALUES (p_user_id, 'vocab', (item->>'vocab_id')::uuid, CURRENT_DATE)
      ON CONFLICT (user_id, vocab_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
