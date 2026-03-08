import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateOrigin } from '../api-utils'

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
