-- Migration 019: Timezone-aware streak & SRS (Audit-E1)
-- Run once in Supabase SQL editor.
--
-- 1. Adds profiles.timezone (IANA string, e.g. 'America/Los_Angeles')
-- 2. Replaces increment_streak_if_new_day to use the user's timezone

ALTER TABLE profiles ADD COLUMN timezone text DEFAULT NULL;

-- Replace the streak RPC to use the user's timezone (fallback: UTC)
CREATE OR REPLACE FUNCTION increment_streak_if_new_day(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  user_tz   text;
  today     text;
  yesterday text;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO user_tz FROM profiles WHERE id = p_user_id;

  today     := (NOW() AT TIME ZONE user_tz)::date::text;
  yesterday := ((NOW() AT TIME ZONE user_tz)::date - 1)::text;

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
