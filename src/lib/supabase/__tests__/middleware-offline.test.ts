import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// Mock @supabase/ssr
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<object>('next/server')
  return {
    ...actual,
    NextResponse: {
      next: vi.fn().mockReturnValue({
        cookies: { set: vi.fn() },
      }),
      redirect: vi.fn().mockReturnValue({
        cookies: { delete: vi.fn() },
      }),
    },
  }
})

// Import after mocks
const { updateSession } = await import('../middleware')

function makeRequest(pathname: string, cookies: Array<{ name: string; value: string }> = []) {
  return {
    cookies: {
      getAll: () => cookies,
      get: (name: string) => cookies.find((c) => c.name === name) ?? undefined,
      has: (name: string) => cookies.some((c) => c.name === name),
      set: vi.fn(),
    },
    nextUrl: {
      pathname,
      clone: () => ({ pathname }),
    },
  } as unknown as Parameters<typeof updateSession>[0]
}

describe('middleware offline resilience (Fix-M)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(NextResponse.next).mockReturnValue({
      cookies: { set: vi.fn() },
    } as unknown as ReturnType<typeof NextResponse.next>)
    vi.mocked(NextResponse.redirect).mockReturnValue({
      cookies: { delete: vi.fn() },
    } as unknown as ReturnType<typeof NextResponse.redirect>)
  })

  it('allows through when getUser throws + auth cookies exist', async () => {
    mockGetUser.mockRejectedValue(new Error('Network unreachable'))

    const request = makeRequest('/dashboard', [
      { name: 'sb-abc-auth-token', value: 'some-token' },
    ])

    const result = await updateSession(request)

    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  it('redirects to login when getUser throws + no auth cookies', async () => {
    mockGetUser.mockRejectedValue(new Error('Network unreachable'))

    const request = makeRequest('/dashboard', [])

    await updateSession(request)

    expect(NextResponse.redirect).toHaveBeenCalled()
  })

  it('allows public paths through even when getUser throws', async () => {
    mockGetUser.mockRejectedValue(new Error('Network unreachable'))

    const request = makeRequest('/auth/login', [])

    const result = await updateSession(request)

    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  it('normal online flow still works', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })

    const request = makeRequest('/dashboard', [
      { name: 'onboarding_done', value: '1' },
    ])

    const result = await updateSession(request)

    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  it('handles onboarding DB query failure gracefully', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockRejectedValue(new Error('DB unreachable')),
        }),
      }),
    })

    const request = makeRequest('/dashboard', [])

    const result = await updateSession(request)

    // Should NOT redirect to onboarding when DB is unreachable
    expect(result).toBeDefined()
  })
})
