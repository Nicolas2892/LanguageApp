import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicPaths = ['/auth/login', '/auth/signup', '/auth/callback', '/brand-preview']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users who haven't completed onboarding
  // Skip API routes — they must never be redirected to a page
  if (user && !isPublic && pathname !== '/onboarding' && !pathname.startsWith('/api/')) {
    // PERF-04: skip DB query when the onboarding cookie is present (set by /api/onboarding/complete)
    const onboardingDone = request.cookies.get('onboarding_done')?.value === '1'

    if (!onboardingDone) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile && !(profile as { onboarding_completed: boolean }).onboarding_completed) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }

      // Onboarding confirmed — persist cookie so future requests skip this query
      if (profile && (profile as { onboarding_completed: boolean }).onboarding_completed) {
        supabaseResponse.cookies.set('onboarding_done', '1', {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365,
          path: '/',
        })
      }
    }
  }

  return supabaseResponse
}
