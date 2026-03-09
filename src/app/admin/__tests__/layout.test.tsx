import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/supabase/server')
vi.mock('@/components/admin/AdminTabNav', () => ({ AdminTabNav: () => <nav data-testid="admin-tab-nav" /> }))

const mockSingle    = vi.fn()
const mockEq        = vi.fn()
const mockSelect    = vi.fn()
const mockFrom      = vi.fn()
const mockGetUser   = vi.fn()

function setupSupabaseMock({ userId = 'user-1', isAdmin = true }: { userId?: string | null; isAdmin?: boolean } = {}) {
  mockGetUser.mockResolvedValue({ data: { user: userId ? { id: userId } : null } })
  mockSingle.mockResolvedValue({ data: isAdmin ? { is_admin: true } : { is_admin: false } })
  mockEq.mockReturnValue({ single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  } as never)
}

// Dynamic import to pick up the mocks
async function renderLayout(children = <div data-testid="child">content</div>) {
  const { default: AdminLayout } = await import('../layout')
  const el = await AdminLayout({ children })
  return render(el)
}

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('redirects to /auth/login when user is not authenticated', async () => {
    setupSupabaseMock({ userId: null })
    await renderLayout()
    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('redirects to /dashboard when is_admin is false', async () => {
    setupSupabaseMock({ isAdmin: false })
    await renderLayout()
    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })

  it('renders children when is_admin is true', async () => {
    setupSupabaseMock({ isAdmin: true })
    const { getByTestId } = await renderLayout()
    expect(getByTestId('child')).toBeInTheDocument()
  })

  it('renders the AdminTabNav when is_admin is true', async () => {
    setupSupabaseMock({ isAdmin: true })
    const { getByTestId } = await renderLayout()
    expect(getByTestId('admin-tab-nav')).toBeInTheDocument()
  })
})
