-- Migration 020: Streak Freeze (Feat-G)
-- Run once in Supabase SQL editor.
--
-- 1. Adds 3 columns to profiles for streak freeze state
-- 2. Replaces increment_streak_if_new_day to support freeze logic + auto-replenish
-- 3. Returns jsonb { freeze_used, freeze_replenished } (callers currently ignore return)

ALTER TABLE profiles ADD COLUMN streak_freeze_remaining integer NOT NULL DEFAULT 1;
ALTER TABLE profiles ADD COLUMN streak_freeze_last_replenished text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN streak_freeze_used_date text DEFAULT NULL;

CREATE OR REPLACE FUNCTION increment_streak_if_new_day(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  user_tz       text;
  today         text;
  yesterday     text;
  day_before    text;
  rec           RECORD;
  result        jsonb := '{"freeze_used": false, "freeze_replenished": false}'::jsonb;
BEGIN
  -- Lock the row to prevent concurrent streak updates
  SELECT
    COALESCE(timezone, 'UTC'),
    streak,
    last_studied_date,
    streak_freeze_remaining,
    streak_freeze_last_replenished
  INTO rec
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  user_tz   := rec.timezone;
  today     := (NOW() AT TIME ZONE COALESCE(user_tz, 'UTC'))::date::text;
  yesterday := ((NOW() AT TIME ZONE COALESCE(user_tz, 'UTC'))::date - 1)::text;
  day_before := ((NOW() AT TIME ZONE COALESCE(user_tz, 'UTC'))::date - 2)::text;

  -- Already studied today — no-op
  IF rec.last_studied_date = today THEN
    RETURN result;
  END IF;

  -- Auto-replenish freeze if 0 remaining and 7+ days since last replenished (or never replenished)
  IF rec.streak_freeze_remaining = 0 AND (
    rec.streak_freeze_last_replenished IS NULL OR
    (today::date - rec.streak_freeze_last_replenished::date) >= 7
  ) THEN
    UPDATE profiles
    SET streak_freeze_remaining = 1,
        streak_freeze_last_replenished = today
    WHERE id = p_user_id;

    rec.streak_freeze_remaining := 1;
    result := jsonb_set(result, '{freeze_replenished}', 'true'::jsonb);
  END IF;

  IF rec.last_studied_date = yesterday THEN
    -- Normal consecutive day — increment streak
    UPDATE profiles
    SET streak = streak + 1,
        last_studied_date = today
    WHERE id = p_user_id;

  ELSIF rec.last_studied_date = day_before AND rec.streak_freeze_remaining > 0 AND rec.streak > 0 THEN
    -- Missed exactly 1 day (yesterday) and has a freeze — preserve streak
    UPDATE profiles
    SET streak = streak + 1,
        last_studied_date = today,
        streak_freeze_remaining = streak_freeze_remaining - 1,
        streak_freeze_used_date = yesterday,
        streak_freeze_last_replenished = CASE
          WHEN streak_freeze_last_replenished IS NULL THEN today
          ELSE streak_freeze_last_replenished
        END
    WHERE id = p_user_id;

    result := jsonb_set(result, '{freeze_used}', 'true'::jsonb);

  ELSIF rec.last_studied_date IS NULL OR rec.last_studied_date < yesterday THEN
    -- Gap > 1 day or first time — reset streak
    UPDATE profiles
    SET streak = 1,
        last_studied_date = today
    WHERE id = p_user_id;

  END IF;

  RETURN result;
END;
$$;
