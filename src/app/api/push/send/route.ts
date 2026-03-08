import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

const BATCH_SIZE = 500

type PushSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

type SubscriberRow = {
  id: string
  streak: number
  push_subscription: PushSubscription
  due_count: number
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

  let sent = 0
  let failed = 0
  let offset = 0

  // Process subscribers in batches — single JOIN query per batch, no per-user sub-queries
  while (true) {
    const { data, error } = await supabase.rpc('get_subscribers_with_due_counts', {
      p_today: today,
      p_limit: BATCH_SIZE,
      p_offset: offset,
    })

    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
    if (!data || data.length === 0) break

    const batch = data as SubscriberRow[]

    const results = await Promise.allSettled(
      batch.map(async (row) => {
        const dueCount = Number(row.due_count)
        const payload = JSON.stringify({
          title: "Don't break your streak!",
          body: `${dueCount > 0 ? `${dueCount} review${dueCount !== 1 ? 's' : ''} due` : 'Time to study'} — ${row.streak}-day streak at risk.`,
          url: '/study',
        })

        try {
          await webpush.sendNotification(row.push_subscription, payload)
        } catch (err: unknown) {
          // 410 Gone = subscription expired; clean it up
          if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
            await supabase
              .from('profiles')
              .update({ push_subscription: null })
              .eq('id', row.id)
          }
          throw err
        }
      })
    )

    sent += results.filter((r) => r.status === 'fulfilled').length
    failed += results.filter((r) => r.status === 'rejected').length

    if (batch.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  return NextResponse.json({ sent, failed })
}
