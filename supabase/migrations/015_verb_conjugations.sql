-- Migration 015: verb_conjugations table
-- Stores all 6 conjugated forms + stem per verb × tense
-- Used by the verb detail page to show complete paradigm tables

CREATE TABLE verb_conjugations (
  verb_id    uuid NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
  tense      text NOT NULL,
  stem       text NOT NULL DEFAULT '',  -- invariant prefix; '' = fully irregular (colour whole word)
  yo         text NOT NULL,
  tu         text NOT NULL,
  el         text NOT NULL,
  nosotros   text NOT NULL,
  vosotros   text NOT NULL,
  ellos      text NOT NULL,
  PRIMARY KEY (verb_id, tense)
);

ALTER TABLE verb_conjugations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verb_conjugations_public_read"
  ON verb_conjugations FOR SELECT
  USING (true);
