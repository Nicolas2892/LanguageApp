// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { clearRateLimitStore } from '@/lib/rate-limit'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/azure/client', () => ({
  assessPronunciation: vi.fn(),
}))
vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn(() => true),
}))
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mocked(createClient).mockResolvedValue({
  auth: { getUser: mockGetUser },
  from: mockFrom,
} as never)

const USER_ID = '11111111-1111-1111-1111-111111111111'

function makeFormData(opts?: { text?: string; audioSize?: number }) {
  const content = opts?.audioSize ? new Uint8Array(opts.audioSize) : new Uint8Array([1, 2, 3])
  const blob = new Blob([content], { type: 'audio/webm' })
  const form = new FormData()
  form.append('audio', blob, 'recording.webm')
  if (opts?.text !== undefined) {
    form.append('text', opts.text)
  } else {
    form.append('text', 'El año pasado viajé a Barcelona')
  }
  return form
}

function makeRequest(body?: FormData) {
  return new Request('http://localhost:3000/api/pronunciation/assess', {
    method: 'POST',
    body: body ?? makeFormData(),
    headers: { origin: 'http://localhost:3000' },
  })
}

describe('POST /api/pronunciation/assess', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    clearRateLimitStore()
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } })
    vi.mocked(validateOrigin).mockReturnValue(true)

    // Mock profiles query for target_accent
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { target_accent: 'castilian' }, error: null }),
        }),
      }),
    })

    // Mock Azure assessment
    const { assessPronunciation } = await import('@/lib/azure/client')
    vi.mocked(assessPronunciation).mockResolvedValue({
      overallScore: 85,
      fluencyScore: 90,
      prosodyScore: 78,
      words: [
        { word: 'El', accuracyScore: 95, phonemes: [{ phoneme: 'e', score: 95 }, { phoneme: 'l', score: 94 }] },
        { word: 'año', accuracyScore: 72, phonemes: [{ phoneme: 'a', score: 90 }, { phoneme: 'ɲ', score: 55 }, { phoneme: 'o', score: 88 }] },
      ],
    })
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
    for (let i = 0; i < 30; i++) {
      await POST(makeRequest())
    }
    const res = await POST(makeRequest())
    expect(res.status).toBe(429)
  })

  it('returns 400 when audio field is missing', async () => {
    const form = new FormData()
    form.append('text', 'Hola')
    const req = new Request('http://localhost:3000/api/pronunciation/assess', {
      method: 'POST',
      body: form,
      headers: { origin: 'http://localhost:3000' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Missing audio')
  })

  it('returns 400 when text field is missing', async () => {
    const content = new Uint8Array([1, 2, 3])
    const blob = new Blob([content], { type: 'audio/webm' })
    const form = new FormData()
    form.append('audio', blob, 'recording.webm')
    const req = new Request('http://localhost:3000/api/pronunciation/assess', {
      method: 'POST',
      body: form,
      headers: { origin: 'http://localhost:3000' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Missing text')
  })

  it('returns 400 when audio exceeds 5MB', async () => {
    const form = makeFormData({ audioSize: 6 * 1024 * 1024 })
    const res = await POST(makeRequest(form))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('too large')
  })

  it('returns 200 with pronunciation scores on success', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.overallScore).toBe(85)
    expect(data.fluencyScore).toBe(90)
    expect(data.prosodyScore).toBe(78)
    expect(data.words).toHaveLength(2)
    expect(data.words[0].word).toBe('El')
    expect(data.words[1].phonemes).toHaveLength(3)
  })

  it('calls Azure with correct locale for castilian', async () => {
    await POST(makeRequest())
    const { assessPronunciation } = await import('@/lib/azure/client')
    expect(vi.mocked(assessPronunciation)).toHaveBeenCalledWith(
      expect.any(Buffer),
      'El año pasado viajé a Barcelona',
      'castilian',
    )
  })

  it('returns 500 and captures exception on Azure error', async () => {
    const { assessPronunciation } = await import('@/lib/azure/client')
    vi.mocked(assessPronunciation).mockRejectedValueOnce(new Error('Azure down'))

    const Sentry = await import('@sentry/nextjs')
    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    expect(Sentry.captureException).toHaveBeenCalled()
  })
})
