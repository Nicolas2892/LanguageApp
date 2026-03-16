-- Add English translation column to verb_sentences
-- Nullable — will be backfilled via scripts/backfill-verb-translations.ts
ALTER TABLE verb_sentences ADD COLUMN english text DEFAULT NULL;
