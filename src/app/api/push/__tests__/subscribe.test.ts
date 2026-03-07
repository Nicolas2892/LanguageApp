import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn(() => true),
}))

import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { POST } from '../subscribe/route'

const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: mockFrom,
}

function makeRequest(body: unknown, origin = 'http://localhost:3000'): Request {
  return new Request('http://localhost:3000/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin },
    body: JSON.stringify(body),
  })
}

describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    ;(validateOrigin as ReturnType<typeof vi.fn>).mockReturnValue(true)

    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })
  })

  it('stores subscription for a valid FCM endpoint', async () => {
    const body = {
      subscription: {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-token',
        keys: { p256dh: 'key123', auth: 'auth123' },
      },
    }
    const response = await POST(makeRequest(body))
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.ok).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({ push_subscription: body.subscription })
  })

  it('returns 422 for a non-allowlisted push endpoint hostname', async () => {
    const body = {
      subscription: {
        endpoint: 'https://attacker.internal/collect',
        keys: { p256dh: 'key123', auth: 'auth123' },
      },
    }
    const response = await POST(makeRequest(body))
    expect(response.status).toBe(422)
    const json = await response.json()
    expect(json.error).toBe('Invalid push endpoint')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const body = {
      subscription: {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'key', auth: 'auth' },
      },
    }
    const response = await POST(makeRequest(body))
    expect(response.status).toBe(401)
  })

  it('returns 403 when Origin is invalid', async () => {
    ;(validateOrigin as ReturnType<typeof vi.fn>).mockReturnValue(false)
    const body = {
      subscription: {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'key', auth: 'auth' },
      },
    }
    const response = await POST(makeRequest(body, 'https://evil.com'))
    expect(response.status).toBe(403)
  })

  it('returns 400 for invalid subscription schema', async () => {
    const response = await POST(makeRequest({ subscription: { endpoint: 'not-a-url' } }))
    expect(response.status).toBe(400)
  })
})
