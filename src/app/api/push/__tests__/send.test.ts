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

import { createClient } from '@/lib/supabase/server'

const mockRpc = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateEq = vi.fn()

const mockSupabase = {
  rpc: mockRpc,
  from: vi.fn(() => ({ update: mockUpdate })),
}

function makeRequest(secret?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['Authorization'] = `Bearer ${secret}`
  return new Request('http://localhost:3000/api/push/send', {
    method: 'POST',
    headers,
  })
}

const mockSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-token',
  keys: { p256dh: 'key123', auth: 'auth123' },
}

describe('POST /api/push/send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
    mockUpdate.mockReturnValue({ eq: mockUpdateEq })
    mockUpdateEq.mockResolvedValue({ error: null })
    mockSendNotification.mockResolvedValue({})

    process.env.VAPID_EMAIL = 'mailto:test@example.com'
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key'
    process.env.VAPID_PRIVATE_KEY = 'test-private-key'
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  async function importRoute() {
    vi.resetModules()

    vi.doMock('web-push', () => ({
      default: {
        setVapidDetails: vi.fn(),
        sendNotification: (...args: unknown[]) => mockSendNotification(...args),
      },
    }))
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: vi.fn().mockResolvedValue(mockSupabase),
    }))

    const mod = await import('../send/route')
    return mod
  }

  it('returns 503 when VAPID not configured', async () => {
    delete process.env.VAPID_EMAIL
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
    const { POST } = await importRoute()
    const res = await POST(makeRequest('test-cron-secret'))
    expect(res.status).toBe(503)
  })

  it('returns 401 when CRON_SECRET missing', async () => {
    delete process.env.CRON_SECRET
    const { POST } = await importRoute()
    const res = await POST(makeRequest('wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when Authorization header wrong', async () => {
    const { POST } = await importRoute()
    const res = await POST(makeRequest('wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 200 with sent count on success', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'user-1', streak: 5, push_subscription: mockSubscription, due_count: 3 },
        { id: 'user-2', streak: 10, push_subscription: mockSubscription, due_count: 1 },
      ],
      error: null,
    })
    const { POST } = await importRoute()
    const res = await POST(makeRequest('test-cron-secret'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ sent: 2, failed: 0 })
    expect(mockSendNotification).toHaveBeenCalledTimes(2)

    // Verify Spanish copy in payload
    const firstPayload = JSON.parse(mockSendNotification.mock.calls[0][1])
    expect(firstPayload.title).toBe('¡No pierdas tu racha!')
    expect(firstPayload.body).toContain('3 repasos pendientes')
    expect(firstPayload.body).toContain('5 días')
  })

  it('handles 410 expired subscription — cleans up and counts as failed', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'user-1', streak: 5, push_subscription: mockSubscription, due_count: 2 },
      ],
      error: null,
    })
    const error410 = Object.assign(new Error('Gone'), { statusCode: 410 })
    mockSendNotification.mockRejectedValue(error410)

    const { POST } = await importRoute()
    const res = await POST(makeRequest('test-cron-secret'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ sent: 0, failed: 1 })

    // Should have cleaned up the subscription
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    expect(mockUpdate).toHaveBeenCalledWith({ push_subscription: null })
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('returns 500 on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })
    const { POST } = await importRoute()
    const res = await POST(makeRequest('test-cron-secret'))
    expect(res.status).toBe(500)
  })

  it('returns sent 0 failed 0 for empty subscriber list', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    const { POST } = await importRoute()
    const res = await POST(makeRequest('test-cron-secret'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ sent: 0, failed: 0 })
  })

  it('uses singular form for 1 repaso pendiente', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'user-1', streak: 3, push_subscription: mockSubscription, due_count: 1 },
      ],
      error: null,
    })
    const { POST } = await importRoute()
    await POST(makeRequest('test-cron-secret'))
    const payload = JSON.parse(mockSendNotification.mock.calls[0][1])
    expect(payload.body).toContain('1 repaso pendiente')
    expect(payload.body).not.toContain('repasos')
  })

  it('uses "Hora de estudiar" when due count is 0', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'user-1', streak: 7, push_subscription: mockSubscription, due_count: 0 },
      ],
      error: null,
    })
    const { POST } = await importRoute()
    await POST(makeRequest('test-cron-secret'))
    const payload = JSON.parse(mockSendNotification.mock.calls[0][1])
    expect(payload.body).toContain('Hora de estudiar')
  })
})
