-- Ped-J: "Hard" flag on a concept
-- Adds is_hard boolean to user_progress; existing rows default to false atomically.
ALTER TABLE user_progress
  ADD COLUMN is_hard boolean NOT NULL DEFAULT false;
