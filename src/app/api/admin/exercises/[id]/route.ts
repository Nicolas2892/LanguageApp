import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import type { Profile } from '@/lib/supabase/types'
import * as Sentry from '@sentry/nextjs'

const ExerciseUpdateSchema = z.object({
  prompt: z.string().min(1).max(2000),
  expected_answer: z.string().max(2000).nullable(),
  hint_1: z.string().max(500).nullable(),
  hint_2: z.string().max(500).nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  const profile = profileData as Pick<Profile, 'is_admin'> | null
  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ExerciseUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation error' }, { status: 400 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('exercises')
    .update(parsed.data)
    .eq('id', id)

  if (error) {
    console.error('[PATCH /api/admin/exercises/[id]]', error)
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[PATCH /api/admin/exercises/[id]] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  const profile = profileData as Pick<Profile, 'is_admin'> | null
  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[DELETE /api/admin/exercises/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[DELETE /api/admin/exercises/[id]] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
