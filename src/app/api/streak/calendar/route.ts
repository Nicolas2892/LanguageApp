import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { utcToLocalDate } from '@/lib/timezone'

/**
 * GET /api/streak/calendar?month=YYYY-MM
 *
 * Returns studied dates for the given month plus streak metadata.
 * Used by the StreakCalendarModal to render a motivational calendar.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const monthParam = url.searchParams.get('month')

  // Validate month format YYYY-MM (default to current month)
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth() + 1
  if (monthParam) {
    const match = monthParam.match(/^(\d{4})-(0[1-9]|1[0-2])$/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM.' }, { status: 400 })
    }
    year = parseInt(match[1], 10)
    month = parseInt(match[2], 10)
  }

  // Build UTC range for the month (generous boundaries to cover all timezones)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00Z`

  // Fetch profile data + exercise attempts in parallel
  const [{ data: profile }, { data: attempts }] = await Promise.all([
    supabase
      .from('profiles')
      .select('streak, streak_freeze_remaining, streak_freeze_used_date, last_studied_date, timezone')
      .eq('id', user.id)
      .single(),
    supabase
      .from('exercise_attempts')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lt('created_at', endDate),
  ])

  const p = profile as {
    streak: number | null
    streak_freeze_remaining: number | null
    streak_freeze_used_date: string | null
    last_studied_date: string | null
    timezone: string | null
  } | null

  const timezone = p?.timezone ?? null

  // Deduplicate dates in user's local timezone
  const dateSet = new Set<string>()
  if (attempts) {
    for (const a of attempts as { created_at: string }[]) {
      dateSet.add(utcToLocalDate(a.created_at, timezone))
    }
  }

  // Filter to only dates within the requested month
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
  const studiedDates = [...dateSet].filter(d => d.startsWith(monthPrefix)).sort()

  return NextResponse.json({
    studiedDates,
    streak: p?.streak ?? 0,
    freezeRemaining: p?.streak_freeze_remaining ?? 0,
    freezeUsedDate: p?.streak_freeze_used_date ?? null,
    lastStudiedDate: p?.last_studied_date ?? null,
  })
}
