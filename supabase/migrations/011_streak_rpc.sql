-- Migration 011: Atomic streak increment RPC
-- Run once in Supabase SQL editor.
-- Replaces the racy read-then-write streak pattern in /api/submit and /api/grade
-- with a single atomic UPDATE that only fires when last_studied_date differs from today.
--
-- Audit-E7: This RPC uses `NOW() AT TIME ZONE 'UTC'` for date boundaries.
-- The SRS due_date in sm2() (src/lib/srs/index.ts) also uses UTC (via new Date()
-- on Vercel's UTC servers). Both systems are aligned in production.

CREATE OR REPLACE FUNCTION increment_streak_if_new_day(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  today      text := (NOW() AT TIME ZONE 'UTC')::date::text;
  yesterday  text := ((NOW() AT TIME ZONE 'UTC')::date - 1)::text;
BEGIN
  UPDATE profiles
  SET
    streak = CASE
      WHEN last_studied_date = yesterday THEN streak + 1
      WHEN last_studied_date IS NULL OR last_studied_date < yesterday THEN 1
      ELSE streak
    END,
    last_studied_date = today
  WHERE id = p_user_id
    AND last_studied_date IS DISTINCT FROM today;
END;
$$;
