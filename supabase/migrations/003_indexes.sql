-- study_sessions: new index (not in 001_initial_schema.sql)
-- Needed for ActivityHeatmap and session history queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_started
  ON study_sessions (user_id, started_at DESC);

-- NOTE: user_progress(user_id, due_date) and exercise_attempts(user_id, created_at)
-- were already indexed (unnamed) in 001_initial_schema.sql — no action needed.
