import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import type { Profile } from '@/lib/supabase/types'

export const runtime = 'nodejs'

const vapidConfigured =
  !!process.env.VAPID_EMAIL &&
  !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  !!process.env.VAPID_PRIVATE_KEY

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
}

export async function POST(request: Request) {
  if (!vapidConfigured) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, push_subscription')
    .eq('id', user.id)
    .single()

  const p = profile as Pick<Profile, 'is_admin' | 'push_subscription'> | null
  if (!p?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!p.push_subscription) {
    return NextResponse.json({ error: 'No push subscription found — enable notifications first' }, { status: 422 })
  }

  const payload = JSON.stringify({
    title: '🔔 Notificación de prueba',
    body: 'Las notificaciones push funcionan correctamente.',
    url: '/account',
  })

  try {
    await webpush.sendNotification(
      p.push_subscription as { endpoint: string; keys: { p256dh: string; auth: string } },
      payload,
    )
  } catch (err: unknown) {
    const statusCode = err && typeof err === 'object' && 'statusCode' in err
      ? (err as { statusCode: number }).statusCode
      : undefined
    return NextResponse.json(
      { error: 'Push delivery failed', statusCode },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
