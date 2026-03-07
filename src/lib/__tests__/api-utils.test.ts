import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateOrigin } from '../api-utils'

function makeRequest(origin: string | null): Request {
  const headers = new Headers()
  if (origin !== null) headers.set('origin', origin)
  return new Request('http://localhost:3000/api/test', { method: 'POST', headers })
}

describe('validateOrigin', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Reset to test defaults
    process.env.NODE_ENV = 'test'
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  afterEach(() => {
    Object.assign(process.env, originalEnv)
  })

  it('returns false when Origin header is missing', () => {
    expect(validateOrigin(makeRequest(null))).toBe(false)
  })

  it('allows localhost in non-production environment', () => {
    process.env.NODE_ENV = 'test'
    expect(validateOrigin(makeRequest('http://localhost:3000'))).toBe(true)
  })

  it('allows localhost in development environment', () => {
    process.env.NODE_ENV = 'development'
    expect(validateOrigin(makeRequest('http://localhost:3000'))).toBe(true)
  })

  it('returns true when Origin matches NEXT_PUBLIC_SITE_URL', () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myapp.vercel.app'
    expect(validateOrigin(makeRequest('https://myapp.vercel.app'))).toBe(true)
  })

  it('returns false for wrong origin in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myapp.vercel.app'
    expect(validateOrigin(makeRequest('https://evil.com'))).toBe(false)
  })

  it('returns false when NEXT_PUBLIC_SITE_URL is not set and origin is not localhost', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(validateOrigin(makeRequest('https://evil.com'))).toBe(false)
  })

  it('returns false for localhost in production when NEXT_PUBLIC_SITE_URL does not match', () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myapp.vercel.app'
    expect(validateOrigin(makeRequest('http://localhost:3000'))).toBe(false)
  })
})
