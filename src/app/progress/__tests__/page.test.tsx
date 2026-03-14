import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT') }),
}))

vi.mock('@/components/AnimatedBar', () => ({
  AnimatedBar: ({ pct }: { pct: number }) => <div data-testid="animated-bar">{pct}%</div>,
}))

vi.mock('@/components/BackgroundMagicS', () => ({
  BackgroundMagicS: () => null,
}))

vi.mock('@/components/WindingPathSeparator', () => ({
  WindingPathSeparator: () => <hr />,
}))

vi.mock('@/components/EmptyState', () => ({
  EmptyState: ({ heading }: { heading: string }) => <div data-testid="empty-state">{heading}</div>,
}))

vi.mock('@/components/verbs/VerbTenseMastery', () => ({
  VerbTenseMastery: () => <div data-testid="verb-tense-mastery" />,
}))

vi.mock('../WeeklyActivityChart', () => ({
  WeeklyActivityChart: () => <div data-testid="weekly-chart" />,
}))

// ─── Supabase mock ──────────────────────────────────────────────────────────

type AccuracyRow = { exercise_type: string; total_attempts: number; correct_count: number }

interface MockOptions {
  userId?: string | null
  profile?: { streak: number; computed_level: string; timezone: string | null } | null
  concepts?: Array<{ id: string; level: string }>
  progress?: Array<{ concept_id: string; interval_days: number; production_mastered: boolean }>
  accuracyRows?: AccuracyRow[]
  activityRows?: Array<{ created_at: string }>
  sessionRows?: Array<{ started_at: string; ended_at: string | null }>
  verbProgressRows?: Array<{ tense: string; attempt_count: number; correct_count: number }>
}

function makeMockSupabase(opts: MockOptions = {}) {
  const userId = opts.userId === undefined ? 'user-1' : opts.userId
  const profile = opts.profile ?? { streak: 5, computed_level: 'B1', timezone: null }
  const concepts = opts.concepts ?? [
    { id: 'c1', level: 'B1' },
    { id: 'c2', level: 'B2' },
  ]
  const progress = opts.progress ?? []
  const accuracy = opts.accuracyRows ?? []
  const activity = opts.activityRows ?? []
  const sessions = opts.sessionRows ?? []
  const verbProgress = opts.verbProgressRows ?? []

  return {
    auth: {
      getUser: async () => ({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        gte: () => builder,
        gt: () => builder,
        limit: () => builder,
        single: async () => {
          if (table === 'profiles') return { data: profile }
          return { data: null }
        },
        then: undefined as unknown,
      }
      // Make builder thenable so `await` resolves to { data: ... }
      const resolveData = () => {
        if (table === 'concepts') return { data: concepts }
        if (table === 'user_progress') return { data: progress }
        if (table === 'exercise_attempts') return { data: activity }
        if (table === 'study_sessions') return { data: sessions }
        if (table === 'verb_progress') return { data: verbProgress }
        return { data: [] }
      }
      builder.then = (resolve: (v: unknown) => void) => Promise.resolve(resolveData()).then(resolve)
      return builder
    },
    rpc: async (fnName: string) => {
      if (fnName === 'get_accuracy_by_type') {
        return { data: accuracy }
      }
      return { data: null }
    },
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import ProgressPage from '../page'

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ProgressPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeMockSupabase({ userId: null }) as never
    )
    await expect(ProgressPage()).rejects.toThrow('NEXT_REDIRECT')
  })

  it('renders accuracy and total attempts from RPC data', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeMockSupabase({
        accuracyRows: [
          { exercise_type: 'gap_fill', total_attempts: 30, correct_count: 25 },
          { exercise_type: 'translation', total_attempts: 20, correct_count: 15 },
          { exercise_type: '_total', total_attempts: 50, correct_count: 40 },
        ],
      }) as never
    )

    const el = await ProgressPage()
    render(el)

    // Overall accuracy: 40/50 = 80%
    expect(screen.getByText('80%')).toBeInTheDocument()
    // Total attempts shown in subtitle
    expect(screen.getByText(/50 ejercicios/)).toBeInTheDocument()
  })

  it('renders EmptyState when RPC returns no data', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeMockSupabase({ accuracyRows: [] }) as never
    )

    const el = await ProgressPage()
    render(el)

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('renders 0% accuracy when total row has zero correct', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeMockSupabase({
        accuracyRows: [
          { exercise_type: 'gap_fill', total_attempts: 10, correct_count: 0 },
          { exercise_type: '_total', total_attempts: 10, correct_count: 0 },
        ],
      }) as never
    )

    const el = await ProgressPage()
    render(el)

    // 0/10 = 0% — shown in the accuracy stat card
    expect(screen.getByText(/10 ejercicios/)).toBeInTheDocument()
    // The accuracy card renders "0%" in a <p> with font-weight 800
    const accuracyCards = screen.getAllByText('0%')
    expect(accuracyCards.length).toBeGreaterThanOrEqual(1)
  })

  it('renders streak and mastered count', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeMockSupabase({
        profile: { streak: 12, computed_level: 'B2', timezone: null },
        concepts: [
          { id: 'c1', level: 'B1' },
          { id: 'c2', level: 'B2' },
        ],
        progress: [
          { concept_id: 'c1', interval_days: 25, production_mastered: true },
        ],
        accuracyRows: [
          { exercise_type: '_total', total_attempts: 5, correct_count: 3 },
        ],
      }) as never
    )

    const el = await ProgressPage()
    render(el)

    // Streak
    expect(screen.getByText('12')).toBeInTheDocument()
    // Mastered count
    expect(screen.getByText('1')).toBeInTheDocument()
    // Level in subtitle
    expect(screen.getByText(/Nivel B2/)).toBeInTheDocument()
  })
})
