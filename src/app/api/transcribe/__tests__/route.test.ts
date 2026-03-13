// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { clearRateLimitStore } from '@/lib/rate-limit'
import { openai } from '@/lib/openai/client'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/openai/client', () => ({
  openai: {
    audio: {
      transcriptions: {
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
const mockCreate = vi.mocked(openai.audio.transcriptions.create)

vi.mocked(createClient).mockResolvedValue({
  auth: { getUser: mockGetUser },
} as never)

const USER_ID = '11111111-1111-1111-1111-111111111111'

function makeFormData(size?: number) {
  const content = size ? new Uint8Array(size) : new Uint8Array([1, 2, 3])
  const blob = new Blob([content], { type: 'audio/webm' })
  const form = new FormData()
  form.append('audio', blob, 'recording.webm')
  return form
}

function makeRequest(body?: FormData) {
  return new Request('http://localhost:3000/api/transcribe', {
    method: 'POST',
    body: body ?? makeFormData(),
    headers: { origin: 'http://localhost:3000' },
  })
}

describe('POST /api/transcribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRateLimitStore()
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } })
    vi.mocked(validateOrigin).mockReturnValue(true)
    mockCreate.mockResolvedValue({ text: 'Hola mundo' } as never)
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

  it('returns 429 when rate limited', async () => {
    // Exhaust rate limit (20 requests)
    for (let i = 0; i < 20; i++) {
      await POST(makeRequest())
    }
    const res = await POST(makeRequest())
    expect(res.status).toBe(429)
  })

  it('returns 400 when audio field is missing', async () => {
    const form = new FormData()
    const req = new Request('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: form,
      headers: { origin: 'http://localhost:3000' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Missing audio')
  })

  it('returns 400 when audio exceeds 5MB', async () => {
    const form = makeFormData(6 * 1024 * 1024)
    const res = await POST(makeRequest(form))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('too large')
  })

  it('returns 200 with transcript on success', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.text).toBe('Hola mundo')
  })

  it('calls OpenAI with model=whisper-1 and language=es', async () => {
    await POST(makeRequest())
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-1', language: 'es' }),
    )
  })

  it('returns 500 and captures exception on OpenAI error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API down'))

    const Sentry = await import('@sentry/nextjs')
    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    expect(Sentry.captureException).toHaveBeenCalled()
  })
})
