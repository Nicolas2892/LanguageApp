-- Index for ActivityHeatmap and session history queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_started
  ON study_sessions (user_id, started_at DESC);

-- Index for due-date SRS queue (already used heavily)
CREATE INDEX IF NOT EXISTS idx_user_progress_user_due
  ON user_progress (user_id, due_date);

-- Index for exercise_attempts history queries
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_created
  ON exercise_attempts (user_id, created_at DESC);
