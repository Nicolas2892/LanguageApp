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
