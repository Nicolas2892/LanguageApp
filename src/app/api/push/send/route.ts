import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

type PushSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function POST(request: Request) {
  // Verify cron secret to prevent public abuse
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Fetch all subscribed users who have a streak > 0 and haven't studied today
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, streak, push_subscription')
    .not('push_subscription', 'is', null)
    .gt('streak', 0)
    .or(`last_studied_date.is.null,last_studied_date.lt.${today}`)

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  // Count due reviews for each user
  const results = await Promise.allSettled(
    (profiles ?? []).map(async (profile) => {
      const subscription = profile.push_subscription as PushSubscription

      // Get due review count
      const { count } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .lte('due_date', today)

      const dueCount = count ?? 0
      const payload = JSON.stringify({
        title: "Don't break your streak!",
        body: `${dueCount > 0 ? `${dueCount} review${dueCount !== 1 ? 's' : ''} due` : 'Time to study'} — ${profile.streak}-day streak at risk.`,
        url: '/study',
      })

      try {
        await webpush.sendNotification(subscription, payload)
      } catch (err: unknown) {
        // 410 Gone = subscription expired; clean it up
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
          await supabase
            .from('profiles')
            .update({ push_subscription: null })
            .eq('id', profile.id)
        }
        throw err
      }
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
