-- Migration 017: skip_gap_fill user preference
-- Allows users to opt out of gap_fill exercises in mixed-type sessions
ALTER TABLE profiles ADD COLUMN skip_gap_fill boolean NOT NULL DEFAULT false;
