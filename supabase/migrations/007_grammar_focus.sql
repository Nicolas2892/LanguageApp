-- Migration 007: Grammar focus tag on concepts
-- Run each statement in order in the Supabase SQL editor.

-- A: Add grammar_focus column to concepts
ALTER TABLE concepts
  ADD COLUMN IF NOT EXISTS grammar_focus text
  CHECK (grammar_focus IN ('indicative', 'subjunctive', 'both'));

-- B: Seed grammar_focus for all 21 current concepts

-- Indicative — these connectors work with indicative mood
UPDATE concepts SET grammar_focus = 'indicative' WHERE title = 'aunque (+ indicativo)';
UPDATE concepts SET grammar_focus = 'indicative' WHERE title = 'sin embargo';
UPDATE concepts SET grammar_focus = 'indicative' WHERE title = 'por lo tanto / por consiguiente';
UPDATE concepts SET grammar_focus = 'indicative' WHERE title = 'en cambio / por el contrario';
UPDATE concepts SET grammar_focus = 'indicative' WHERE title = 'mientras que';
UPDATE concepts SET grammar_focus = 'indicative' WHERE title = 'puesto que / ya que';
UPDATE concepts SET grammar_focus = 'indicative' WHERE title = 'dado que / en vista de que';
UPDATE concepts SET grammar_focus = 'indicative' WHERE title = 'no obstante';

-- Subjunctive — these structures always require the subjunctive
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'aunque (+ subjuntivo)';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'por más que / por mucho que';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'de ahí que (+ subjuntivo)';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'Verbos de deseo (querer, esperar, desear)';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'Verbos de emoción (alegrarse, temer, sorprender)';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'Verbos de duda y negación (dudar, no creer, negar)';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'Conjunciones temporales con subjuntivo (cuando, en cuanto, hasta que)';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'Conjunciones finales (para que, a fin de que)';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'Condicional tipo 2: Si + imperfecto de subjuntivo';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'Condicional tipo 3: Si + pluscuamperfecto de subjuntivo';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'Ojalá + imperfecto de subjuntivo';
UPDATE concepts SET grammar_focus = 'subjunctive' WHERE title = 'Imperfecto de subjuntivo en estilo indirecto';

-- Both moods — connector that takes indicative or subjunctive depending on certainty
UPDATE concepts SET grammar_focus = 'both' WHERE title = 'a pesar de (que)';
