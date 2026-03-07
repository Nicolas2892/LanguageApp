import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'

const ALLOWED_PUSH_HOSTS = new Set([
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'notify.windows.com',
  'web.push.apple.com',
])

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const endpointHost = new URL(parsed.data.subscription.endpoint).hostname
  if (!ALLOWED_PUSH_HOSTS.has(endpointHost)) {
    return NextResponse.json({ error: 'Invalid push endpoint' }, { status: 422 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ push_subscription: parsed.data.subscription })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('profiles')
    .update({ push_subscription: null })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
