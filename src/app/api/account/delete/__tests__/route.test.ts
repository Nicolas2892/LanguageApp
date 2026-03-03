import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '../route'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

vi.mock('@/lib/supabase/server')
vi.mock('@supabase/supabase-js')

const mockGetUser = vi.fn()
const mockDeleteUser = vi.fn()

function setupMocks({
  userId = 'user-1',
  deleteError = null,
}: {
  userId?: string | null
  deleteError?: { message: string } | null
} = {}) {
  mockGetUser.mockResolvedValue({ data: { user: userId ? { id: userId } : null } })
  mockDeleteUser.mockResolvedValue({ error: deleteError })
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: mockGetUser },
  } as never)
  vi.mocked(createAdminClient).mockReturnValue({
    auth: { admin: { deleteUser: mockDeleteUser } },
  } as never)
}

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  it('returns 401 when unauthenticated', async () => {
    setupMocks({ userId: null })
    const res = await POST()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('calls admin.deleteUser with the correct user ID', async () => {
    setupMocks({ userId: 'user-42' })
    await POST()
    expect(mockDeleteUser).toHaveBeenCalledWith('user-42')
  })

  it('returns 200 { ok: true } on success', async () => {
    setupMocks()
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 500 { error } when deleteUser fails', async () => {
    setupMocks({ deleteError: { message: 'User not found' } })
    const res = await POST()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('User not found')
  })

  it('GET request returns 405', async () => {
    const res = await GET()
    expect(res.status).toBe(405)
  })

  it('does not query the profiles table directly', async () => {
    const mockFrom = vi.fn()
    setupMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    } as never)
    await POST()
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
