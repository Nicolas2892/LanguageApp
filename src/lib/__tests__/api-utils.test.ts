import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateOrigin, updateComputedLevel } from '../api-utils'

function makeRequest(origin: string | null): Request {
  const headers = new Headers()
  if (origin !== null) headers.set('origin', origin)
  return new Request('http://localhost:3000/api/test', { method: 'POST', headers })
}

describe('validateOrigin', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns false when Origin header is missing', () => {
    expect(validateOrigin(makeRequest(null))).toBe(false)
  })

  it('allows localhost in non-production environment', () => {
    vi.stubEnv('NODE_ENV', 'test')
    expect(validateOrigin(makeRequest('http://localhost:3000'))).toBe(true)
  })

  it('allows localhost in development environment', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(validateOrigin(makeRequest('http://localhost:3000'))).toBe(true)
  })

  it('returns true when Origin matches NEXT_PUBLIC_SITE_URL', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://myapp.vercel.app')
    expect(validateOrigin(makeRequest('https://myapp.vercel.app'))).toBe(true)
  })

  it('returns false for wrong origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://myapp.vercel.app')
    expect(validateOrigin(makeRequest('https://evil.com'))).toBe(false)
  })

  it('returns true (fail-open) when NEXT_PUBLIC_SITE_URL is not set — avoids blocking production when env var is missing', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    // Intentional: missing env var warns but does not block requests (fail-open)
    expect(validateOrigin(makeRequest('https://evil.com'))).toBe(true)
  })

  it('returns false for localhost in production when NEXT_PUBLIC_SITE_URL does not match', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://myapp.vercel.app')
    expect(validateOrigin(makeRequest('http://localhost:3000'))).toBe(false)
  })
})

vi.mock('@/lib/mastery/computeLevel', () => ({
  computeLevel: vi.fn().mockReturnValue('B1'),
}))

describe('updateComputedLevel', () => {
  function makeSupabase(levelRows: unknown[] = []) {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const eq = vi.fn().mockResolvedValue({ data: levelRows, error: null })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'concepts') return { select }
      if (table === 'profiles') return { update }
      return {}
    })
    return { from, update } as unknown as { from: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  }

  it('skips computation when justMastered is false', async () => {
    const sb = makeSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateComputedLevel(sb as any, 'user-1', { justMastered: false })
    expect(sb.from).not.toHaveBeenCalled()
  })

  it('skips computation when opts is undefined', async () => {
    const sb = makeSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateComputedLevel(sb as any, 'user-1')
    expect(sb.from).not.toHaveBeenCalled()
  })

  it('runs computation when justMastered is true', async () => {
    const sb = makeSupabase([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateComputedLevel(sb as any, 'user-1', { justMastered: true })
    expect(sb.from).toHaveBeenCalledWith('concepts')
    expect(sb.from).toHaveBeenCalledWith('profiles')
  })
})
