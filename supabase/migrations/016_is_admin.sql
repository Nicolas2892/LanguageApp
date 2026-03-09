-- Migration 016: Add is_admin flag to profiles
-- Run once in Supabase SQL editor.
-- After running, grant yourself admin access:
--   UPDATE profiles SET is_admin = true WHERE id = '<your-uuid>';

ALTER TABLE profiles
  ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
