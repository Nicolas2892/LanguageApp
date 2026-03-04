-- Add annotations column to exercises table for Ped-E grammatical highlighting
ALTER TABLE exercises ADD COLUMN annotations jsonb NULL;
