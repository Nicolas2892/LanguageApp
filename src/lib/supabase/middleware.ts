import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'
import { ROUTES } from '@/lib/routes'

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

  const { pathname } = request.nextUrl

  const publicPaths = [ROUTES.login, ROUTES.signup, ROUTES.authCallback, ROUTES.brandPreview, '/icon', '/apple-icon', '/api/pwa-icon', '/manifest.webmanifest', '/sw.js']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  // Fix-M: Wrap getUser() in try/catch for offline resilience.
  // When Supabase is unreachable, check for auth cookies to allow through.
  let user: { id: string } | null = null
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
  } catch {
    // Supabase unreachable — check for auth session cookies
    const hasAuthCookies = request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
    if (hasAuthCookies && !isPublic) {
      // Auth cookies exist — allow through (offline mode)
      return supabaseResponse
    }
    // No auth cookies — redirect to login as normal
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = ROUTES.login
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!user && !isPublic) {
    // API routes must never be redirected to a page — return 401 JSON instead
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = request.nextUrl.clone()
    url.pathname = ROUTES.login
    const redirectResponse = NextResponse.redirect(url)
    // Clear stale onboarding cookie so a new user on the same browser gets onboarding
    if (request.cookies.has('onboarding_done')) {
      redirectResponse.cookies.delete('onboarding_done')
    }
    return redirectResponse
  }

  // Redirect authenticated users who haven't completed onboarding
  // Skip API routes — they must never be redirected to a page
  if (user && !isPublic && pathname !== ROUTES.onboarding && !pathname.startsWith('/api/')) {
    // PERF-04: skip DB query when the onboarding cookie is present (set by /api/onboarding/complete)
    const onboardingDone = request.cookies.get('onboarding_done')?.value === '1'

    if (!onboardingDone) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profile && !(profile as { onboarding_completed: boolean }).onboarding_completed) {
          const url = request.nextUrl.clone()
          url.pathname = ROUTES.onboarding
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
      } catch {
        // Fix-M: DB unreachable for onboarding check — allow through
      }
    }
  }

  return supabaseResponse
}
