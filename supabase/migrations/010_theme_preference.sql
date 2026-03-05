-- Migration 010: Add theme_preference column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme_preference text
  DEFAULT 'system'
  CHECK (theme_preference IN ('light', 'dark', 'system'));
