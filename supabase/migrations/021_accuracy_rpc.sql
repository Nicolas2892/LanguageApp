-- Migration 021: Accuracy-by-type RPC for progress page
-- Replaces two unbounded queries (exercise_attempts + exercises) with a single
-- aggregate RPC that returns max 6 rows (5 exercise types + 1 total).

CREATE OR REPLACE FUNCTION get_accuracy_by_type(p_user_id uuid)
RETURNS TABLE (
  exercise_type text,
  total_attempts bigint,
  correct_count  bigint
)
LANGUAGE sql STABLE
AS $$
  -- Per-type breakdown (INNER JOIN excludes NULL exercise_id)
  SELECT e.type, COUNT(*), COUNT(*) FILTER (WHERE ea.ai_score >= 2)
  FROM exercise_attempts ea
  JOIN exercises e ON e.id = ea.exercise_id
  WHERE ea.user_id = p_user_id
  GROUP BY e.type

  UNION ALL

  -- Total row (all attempts, including deleted exercises where exercise_id is NULL)
  SELECT '_total'::text, COUNT(*), COUNT(*) FILTER (WHERE ea.ai_score >= 2)
  FROM exercise_attempts ea
  WHERE ea.user_id = p_user_id;
$$;
