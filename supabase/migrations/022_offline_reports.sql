-- Offline report tables for batch grading results
-- Run in Supabase SQL editor after migrations 001–021

CREATE TABLE offline_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  accuracy integer,
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_offline_reports_user_unreviewed
  ON offline_reports (user_id, reviewed) WHERE reviewed = false;

CREATE TABLE offline_report_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES offline_reports(id) ON DELETE CASCADE,
  exercise_id uuid,
  concept_id uuid NOT NULL,
  concept_title text NOT NULL,
  exercise_type text NOT NULL,
  exercise_prompt text NOT NULL,
  user_answer text NOT NULL,
  score integer NOT NULL,
  is_correct boolean NOT NULL,
  feedback text NOT NULL DEFAULT '',
  corrected_version text NOT NULL DEFAULT '',
  explanation text NOT NULL DEFAULT '',
  attempted_at timestamptz NOT NULL
);

CREATE INDEX idx_offline_report_attempts_report
  ON offline_report_attempts (report_id);
