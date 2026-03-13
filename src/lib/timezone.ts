/**
 * Converts a UTC ISO timestamp to a YYYY-MM-DD date string in the user's IANA timezone.
 * Falls back to UTC when timezone is null/undefined/invalid.
 */
export function utcToLocalDate(isoTimestamp: string, timezone?: string | null): string {
  const date = new Date(isoTimestamp)
  try {
    if (timezone) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date)
    }
  } catch {
    // Invalid timezone — fall through to UTC
  }
  return date.toISOString().split('T')[0]
}

/**
 * Returns today's date (YYYY-MM-DD) in the user's IANA timezone.
 * Falls back to UTC when timezone is null/undefined/invalid.
 */
export function userLocalToday(timezone?: string | null): string {
  try {
    if (timezone) {
      // en-CA locale outputs YYYY-MM-DD natively
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    }
  } catch {
    // Invalid timezone string — fall through to UTC
  }
  return new Date().toISOString().split('T')[0]
}
