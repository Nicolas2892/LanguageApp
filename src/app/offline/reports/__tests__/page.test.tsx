import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import OfflineReportsPage from '../page'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT') }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/components/BackgroundMagicS', () => ({
  BackgroundMagicS: () => null,
}))

const mockSelect = vi.fn()
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: mockSelect,
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

function makeReport(id: string, reviewed: boolean, accuracy: number) {
  return {
    id,
    user_id: 'u1',
    session_id: `s-${id}`,
    attempt_count: 10,
    correct_count: Math.round(accuracy / 10),
    accuracy,
    reviewed,
    created_at: '2026-03-15T14:00:00Z',
  }
}

describe('OfflineReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } })
  })

  it('renders empty state when no reports', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    })

    const el = await OfflineReportsPage()
    render(el)
    expect(screen.getByText('No tienes informes pendientes.')).toBeInTheDocument()
  })

  it('renders unreviewed and reviewed sections', async () => {
    const reports = [
      makeReport('r1', false, 80),
      makeReport('r2', true, 60),
    ]

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: reports }),
        }),
      }),
    })

    const el = await OfflineReportsPage()
    render(el)
    expect(screen.getByText('Pendientes de Revisión')).toBeInTheDocument()
    expect(screen.getByText('Revisados')).toBeInTheDocument()
  })

  it('redirects unauthenticated users', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    await expect(OfflineReportsPage()).rejects.toThrow('NEXT_REDIRECT')
  })
})
