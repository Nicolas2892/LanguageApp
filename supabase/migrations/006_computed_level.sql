-- Migration 006: Computed user level (Ped-C)
-- Run each statement in order in the Supabase SQL editor.

-- A: Add CEFR level tag to concepts
ALTER TABLE concepts
  ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'B1'
  CHECK (level IN ('B1', 'B2', 'C1'));

-- B: Add production mastery flag to user_progress
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS production_mastered boolean NOT NULL DEFAULT false;

-- C: Add computed level to profiles (replaces self-reported current_level in the UI)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS computed_level text NOT NULL DEFAULT 'B1'
  CHECK (computed_level IN ('B1', 'B2', 'C1'));

-- D: Seed the 21 concept CEFR levels

-- B1 concepts (difficulty 2, core connectors + basic desire verbs)
UPDATE concepts SET level = 'B1' WHERE title = 'aunque (+ indicativo)';
UPDATE concepts SET level = 'B1' WHERE title = 'sin embargo';
UPDATE concepts SET level = 'B1' WHERE title = 'por lo tanto / por consiguiente';
UPDATE concepts SET level = 'B1' WHERE title = 'en cambio / por el contrario';
UPDATE concepts SET level = 'B1' WHERE title = 'mientras que';
UPDATE concepts SET level = 'B1' WHERE title = 'Verbos de deseo (querer, esperar, desear)';

-- B2 concepts (nuanced mood/register control, hypothetical reasoning)
UPDATE concepts SET level = 'B2' WHERE title = 'aunque (+ subjuntivo)';
UPDATE concepts SET level = 'B2' WHERE title = 'a pesar de (que)';
UPDATE concepts SET level = 'B2' WHERE title = 'puesto que / ya que';
UPDATE concepts SET level = 'B2' WHERE title = 'no obstante';
UPDATE concepts SET level = 'B2' WHERE title = 'Verbos de emoción (alegrarse, temer, sorprender)';
UPDATE concepts SET level = 'B2' WHERE title = 'Verbos de duda y negación (dudar, no creer, negar)';
UPDATE concepts SET level = 'B2' WHERE title = 'Conjunciones finales (para que, a fin de que)';
UPDATE concepts SET level = 'B2' WHERE title = 'dado que / en vista de que';
UPDATE concepts SET level = 'B2' WHERE title = 'por más que / por mucho que';
UPDATE concepts SET level = 'B2' WHERE title = 'Condicional tipo 2: Si + imperfecto de subjuntivo';
UPDATE concepts SET level = 'B2' WHERE title = 'Conjunciones temporales con subjuntivo (cuando, en cuanto, hasta que)';
UPDATE concepts SET level = 'B2' WHERE title = 'Ojalá + imperfecto de subjuntivo';

-- C1 concepts (discourse-level sophistication, high-register)
UPDATE concepts SET level = 'C1' WHERE title = 'de ahí que (+ subjuntivo)';
UPDATE concepts SET level = 'C1' WHERE title = 'Condicional tipo 3: Si + pluscuamperfecto de subjuntivo';
UPDATE concepts SET level = 'C1' WHERE title = 'Imperfecto de subjuntivo en estilo indirecto';

-- E: Grandfather existing users — mark production_mastered = true where
--    a qualifying attempt already exists (Tier 2/3 exercise with ai_score >= 2)
UPDATE user_progress up
SET production_mastered = true
WHERE EXISTS (
  SELECT 1 FROM exercise_attempts ea
  JOIN exercises ex ON ea.exercise_id = ex.id
  WHERE ea.user_id = up.user_id
    AND ex.concept_id = up.concept_id
    AND ex.type IN ('translation', 'transformation', 'sentence_builder', 'free_write')
    AND ea.ai_score >= 2
);
