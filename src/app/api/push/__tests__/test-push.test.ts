import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock webpush before importing route
const mockSendNotification = vi.fn()
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn(() => true),
}))

import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'

const mockSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-token',
  keys: { p256dh: 'key123', auth: 'auth123' },
}

const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: mockFrom,
}

function makeRequest(): Request {
  return new Request('http://localhost:3000/api/push/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: 'http://localhost:3000' },
  })
}

describe('POST /api/push/test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    ;(validateOrigin as ReturnType<typeof vi.fn>).mockReturnValue(true)
    mockSingle.mockResolvedValue({
      data: { is_admin: true, push_subscription: mockSubscription },
    })
    mockSendNotification.mockResolvedValue({})

    // Reset env vars — VAPID must be set for the module-level guard
    process.env.VAPID_EMAIL = 'mailto:test@example.com'
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key'
    process.env.VAPID_PRIVATE_KEY = 'test-private-key'
  })

  // Dynamic import to pick up env vars set in beforeEach
  async function importRoute() {
    // Clear module cache to re-evaluate module-level vapidConfigured
    vi.resetModules()

    // Re-mock after resetModules
    vi.doMock('web-push', () => ({
      default: {
        setVapidDetails: vi.fn(),
        sendNotification: (...args: unknown[]) => mockSendNotification(...args),
      },
    }))
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: vi.fn().mockResolvedValue(mockSupabase),
    }))
    vi.doMock('@/lib/api-utils', () => ({
      validateOrigin: vi.fn(() => true),
    }))

    const mod = await import('../test/route')
    return mod
  }

  it('returns 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await importRoute()
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    mockSingle.mockResolvedValue({
      data: { is_admin: false, push_subscription: mockSubscription },
    })
    const { POST } = await importRoute()
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Admin access required')
  })

  it('returns 422 when user has no push subscription', async () => {
    mockSingle.mockResolvedValue({
      data: { is_admin: true, push_subscription: null },
    })
    const { POST } = await importRoute()
    const res = await POST(makeRequest())
    expect(res.status).toBe(422)
  })

  it('returns 200 and sends notification on success', async () => {
    const { POST } = await importRoute()
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(mockSendNotification).toHaveBeenCalledWith(
      mockSubscription,
      expect.stringContaining('prueba'),
    )
  })

  it('returns 503 when VAPID keys are not configured', async () => {
    delete process.env.VAPID_EMAIL
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
    const { POST } = await importRoute()
    const res = await POST(makeRequest())
    expect(res.status).toBe(503)
  })
})
