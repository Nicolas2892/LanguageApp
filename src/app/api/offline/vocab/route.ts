import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import type { VocabItem, VocabSentence, VocabProgress } from '@/lib/supabase/types'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await checkRateLimit(user.id, 'offline-vocab', { maxRequests: 30, windowMs: 10 * 60 * 1000 })
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    // Check If-None-Match for 304
    const url = new URL(request.url)
    const clientVersion = url.searchParams.get('version')

    const [
      { data: items },
      { data: sentences },
      { data: progress },
    ] = await Promise.all([
      supabase.from('vocab_items').select('*').order('frequency_rank'),
      supabase.from('vocab_sentences').select('*'),
      supabase.from('vocab_progress').select('*').eq('user_id', user.id),
    ])

    const version = String(Date.now())

    if (clientVersion && clientVersion === version) {
      return new NextResponse(null, { status: 304 })
    }

    return NextResponse.json({
      version,
      items: items as VocabItem[] ?? [],
      sentences: sentences as VocabSentence[] ?? [],
      progress: progress as VocabProgress[] ?? [],
    })
  } catch (err) {
    console.error('[offline/vocab] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
