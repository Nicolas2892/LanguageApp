// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, clearAudioCache } from '../route'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { clearRateLimitStore } from '@/lib/rate-limit'
import { openai } from '@/lib/openai/client'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/openai/client', () => ({
  openai: {
    audio: {
      speech: {
        create: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn(() => true),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

const mockGetUser = vi.fn()
const mockCreate = vi.mocked(openai.audio.speech.create)

vi.mocked(createClient).mockResolvedValue({
  auth: { getUser: mockGetUser },
} as never)

const USER_ID = '11111111-1111-1111-1111-111111111111'

function makeRequest(body?: object) {
  return new Request('http://localhost:3000/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body ?? { text: 'Hola mundo' }),
  })
}

describe('POST /api/tts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRateLimitStore()
    clearAudioCache()
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } })
    vi.mocked(validateOrigin).mockReturnValue(true)
    mockCreate.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
    } as never)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 403 when CSRF validation fails', async () => {
    vi.mocked(validateOrigin).mockReturnValueOnce(false)
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
  })

  it('returns 400 for missing text field', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty text', async () => {
    const res = await POST(makeRequest({ text: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    // Exhaust rate limit (30 requests)
    for (let i = 0; i < 30; i++) {
      await POST(makeRequest())
    }
    const res = await POST(makeRequest())
    expect(res.status).toBe(429)
  })

  it('returns audio/mpeg on success', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg')
  })

  it('calls OpenAI TTS with correct params', async () => {
    await POST(makeRequest({ text: 'Test speech' }))
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'tts-1',
        voice: 'nova',
        input: 'Test speech',
        response_format: 'mp3',
      }),
    )
  })

  it('returns cached audio on second request with same text', async () => {
    await POST(makeRequest({ text: 'Same text' }))
    await POST(makeRequest({ text: 'Same text' }))
    // OpenAI should only be called once
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('calls OpenAI separately for different text', async () => {
    await POST(makeRequest({ text: 'Text A' }))
    await POST(makeRequest({ text: 'Text B' }))
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('returns 500 and captures exception on OpenAI error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API down'))
    const Sentry = await import('@sentry/nextjs')
    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    expect(Sentry.captureException).toHaveBeenCalled()
  })

  it('sets Cache-Control header', async () => {
    const res = await POST(makeRequest())
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400')
  })
})
