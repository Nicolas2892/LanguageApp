-- PERF-03: Replace N+1 pattern in /api/push/send with a single JOIN query.
-- Returns subscribed profiles that haven't studied today, with their due review count,
-- paginated to keep memory usage bounded.
CREATE OR REPLACE FUNCTION get_subscribers_with_due_counts(
  p_today  date,
  p_limit  integer,
  p_offset integer
)
RETURNS TABLE (
  id                uuid,
  streak            integer,
  push_subscription jsonb,
  due_count         bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.streak,
    p.push_subscription,
    COUNT(up.id) AS due_count
  FROM profiles p
  LEFT JOIN user_progress up
    ON  up.user_id  = p.id
    AND up.due_date <= p_today
  WHERE p.push_subscription IS NOT NULL
    AND p.streak > 0
    AND (p.last_studied_date IS NULL OR p.last_studied_date < p_today)
  GROUP BY p.id, p.streak, p.push_subscription
  ORDER BY p.id
  LIMIT  p_limit
  OFFSET p_offset;
$$;
