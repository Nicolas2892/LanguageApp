-- Migration 018: Exercise pool — source tracking + ON DELETE SET NULL for attempt history
-- Run in Supabase SQL editor

-- Add source column (existing rows default to 'seed')
ALTER TABLE exercises
  ADD COLUMN source text NOT NULL DEFAULT 'seed'
    CHECK (source IN ('seed', 'ai_generated'));

-- Change FK to SET NULL (preserves attempt history when exercise deleted)
ALTER TABLE exercise_attempts
  DROP CONSTRAINT exercise_attempts_exercise_id_fkey,
  ADD CONSTRAINT exercise_attempts_exercise_id_fkey
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;
