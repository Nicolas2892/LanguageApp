import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import OfflineReportDetailPage from '../page'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT') }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/components/BackgroundMagicS', () => ({
  BackgroundMagicS: () => null,
}))

const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

const makeReport = () => ({
  id: 'r1',
  user_id: 'u1',
  session_id: 's1',
  attempt_count: 2,
  correct_count: 1,
  accuracy: 50,
  reviewed: false,
  created_at: '2026-03-15T14:00:00Z',
})

const makeAttempt = (id: string, correct: boolean) => ({
  id,
  report_id: 'r1',
  exercise_id: 'e1',
  concept_id: 'c1',
  concept_title: 'Ser vs Estar',
  exercise_type: 'translation',
  exercise_prompt: 'Translate this',
  user_answer: 'La respuesta',
  score: correct ? 3 : 0,
  is_correct: correct,
  feedback: correct ? 'Good' : 'Wrong',
  corrected_version: correct ? '' : 'Corrected text',
  explanation: '',
  attempted_at: '2026-03-15T14:00:00Z',
})

describe('OfflineReportDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } })

    // offline_reports query then offline_report_attempts query
    let fromCallCount = 0
    mockSupabase.from.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        // offline_reports
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: makeReport() }),
              }),
            }),
          }),
        }
      }
      // offline_report_attempts
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [makeAttempt('a1', true), makeAttempt('a2', false)],
            }),
          }),
        }),
      }
    })
  })

  it('renders report summary', async () => {
    const el = await OfflineReportDetailPage({ params: Promise.resolve({ id: 'r1' }) })
    render(el)
    expect(screen.getByText('Informe Offline')).toBeInTheDocument()
    expect(screen.getByText('1/2 correctas')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders attempt rows', async () => {
    const el = await OfflineReportDetailPage({ params: Promise.resolve({ id: 'r1' }) })
    render(el)
    expect(screen.getAllByText('Ser vs Estar')).toHaveLength(2)
    expect(screen.getByText('Resultados')).toBeInTheDocument()
  })

  it('renders mark reviewed button when not reviewed', async () => {
    const el = await OfflineReportDetailPage({ params: Promise.resolve({ id: 'r1' }) })
    render(el)
    expect(screen.getByText('Marcar como revisado')).toBeInTheDocument()
  })

  it('redirects unauthenticated users', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    await expect(
      OfflineReportDetailPage({ params: Promise.resolve({ id: 'r1' }) }),
    ).rejects.toThrow('NEXT_REDIRECT')
  })
})
