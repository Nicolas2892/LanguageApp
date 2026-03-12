import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockRedirect = vi.fn((url: string) => { throw new Error('NEXT_REDIRECT') })

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

// Stub TutorChat so we can inspect props without pulling in the full client component
vi.mock('../TutorChat', () => ({
  TutorChat: ({ conceptId, conceptTitle }: { conceptId?: string; conceptTitle?: string }) => (
    <div data-testid="tutor-chat" data-concept-id={conceptId ?? ''} data-concept-title={conceptTitle ?? ''} />
  ),
}))

import TutorPage from '../page'

// ─── Helpers ────────────────────────────────────────────────────────────────

function authedUser(id = 'u1') {
  mockGetUser.mockResolvedValue({ data: { user: { id } } })
}

function mockConceptLookup(title: string) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: { title } }),
      }),
    }),
  })
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('TutorPage (server component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to login when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(TutorPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('renders D5 header with senda-eyebrow and senda-heading', async () => {
    authedUser()
    const el = await TutorPage({ searchParams: Promise.resolve({}) })
    render(el)

    expect(screen.getByText('Tu Tutor de Español')).toHaveClass('senda-eyebrow')
    expect(screen.getByText('Tutor IA')).toHaveClass('senda-heading')
  })

  it('renders SvgSendaPath in the header', async () => {
    authedUser()
    const el = await TutorPage({ searchParams: Promise.resolve({}) })
    const { container } = render(el)

    const svg = container.querySelector('header svg')
    expect(svg).toBeInTheDocument()
  })

  it('passes conceptId and conceptTitle to TutorChat', async () => {
    authedUser()
    mockConceptLookup('Subjuntivo Presente')

    const el = await TutorPage({ searchParams: Promise.resolve({ concept: 'c123' }) })
    render(el)

    const chat = screen.getByTestId('tutor-chat')
    expect(chat).toHaveAttribute('data-concept-id', 'c123')
    expect(chat).toHaveAttribute('data-concept-title', 'Subjuntivo Presente')
  })

  it('passes undefined conceptTitle when no concept param', async () => {
    authedUser()
    const el = await TutorPage({ searchParams: Promise.resolve({}) })
    render(el)

    const chat = screen.getByTestId('tutor-chat')
    expect(chat).toHaveAttribute('data-concept-id', '')
    expect(chat).toHaveAttribute('data-concept-title', '')
  })

  it('header border uses --d5-line token', async () => {
    authedUser()
    const el = await TutorPage({ searchParams: Promise.resolve({}) })
    const { container } = render(el)

    const header = container.querySelector('header') as HTMLElement
    expect(header.style.borderBottom).toContain('var(--d5-line)')
  })
})
