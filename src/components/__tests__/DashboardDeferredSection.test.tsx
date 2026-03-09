import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardDeferredSection, DashboardDeferredSkeleton } from '../DashboardDeferredSection'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

import { createClient } from '@/lib/supabase/server'

const THIS_WEEK = new Date('2026-03-02T00:00:00.000Z').toISOString()
const LAST_WEEK = new Date('2026-02-23T00:00:00.000Z').toISOString()

const defaultProps = {
  userId: 'user-1',
  dueCount: 5,
  isNewUser: false,
  modules: [{ id: 'mod-1', title: 'Connectors' }],
  thisWeekStart: THIS_WEEK,
  lastWeekStart: LAST_WEEK,
}

function makeSupabaseMock({
  weakestConceptId = 'concept-abc',
  mistakeExerciseIds = [] as string[],
  thisWeekAttempts = [] as { ai_score: number | null }[],
  lastWeekAttempts = [] as { ai_score: number | null }[],
  thisWeekSessions = [] as { started_at: string; ended_at: string | null }[],
  lastWeekSessions = [] as { started_at: string; ended_at: string | null }[],
  dueByModule = [] as unknown[],
  writeConceptTitle = 'El Subjuntivo',
} = {}) {
  // Build a chainable query builder mock
  const makeQuery = (data: unknown[]) => {
    const obj: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'lte', 'lt', 'gte', 'not', 'order', 'limit', 'in', 'single']
    for (const m of methods) {
      obj[m] = vi.fn().mockReturnValue(obj)
    }
    // make it thenable (await resolves to { data, error: null })
    obj.then = (resolve: (v: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data, error: null }).then(resolve)
    obj.single = vi.fn().mockReturnValue({
      then: (resolve: (v: { data: unknown; error: null }) => unknown) =>
        Promise.resolve({
          data: { id: weakestConceptId, title: writeConceptTitle },
          error: null,
        }).then(resolve),
    })
    return obj
  }

  const fromMap: Record<string, unknown> = {
    user_progress: (() => {
      // weakest progress query: returns one row
      // dueByModule query: returns dueByModule array
      // We need to distinguish the two user_progress queries.
      // The weakest query uses .order+.limit(1), dueByModule uses lte(due_date)
      // We'll use a counter approach via callCount.
      let callCount = 0
      const obj: Record<string, unknown> = {}
      const methods = ['eq', 'lt', 'lte', 'gte', 'order', 'limit', 'in', 'not']
      for (const m of methods) {
        obj[m] = vi.fn().mockReturnValue(obj)
      }
      obj.select = vi.fn().mockImplementation(() => {
        callCount++
        const result =
          callCount === 1
            ? [{ concept_id: weakestConceptId, interval_days: 3 }]
            : dueByModule
        const inner: Record<string, unknown> = {}
        for (const m of methods) {
          inner[m] = vi.fn().mockReturnValue(inner)
        }
        inner.then = (resolve: (v: { data: unknown; error: null }) => unknown) =>
          Promise.resolve({ data: result, error: null }).then(resolve)
        return inner
      })
      return obj
    })(),
    exercise_attempts: (() => {
      let callCount = 0
      const obj: Record<string, unknown> = {}
      obj.select = vi.fn().mockImplementation(() => {
        callCount++
        const data =
          callCount === 1
            ? mistakeExerciseIds.map((id) => ({ exercise_id: id }))
            : callCount === 2
            ? thisWeekAttempts
            : lastWeekAttempts
        const inner: Record<string, unknown> = {}
        const methods = ['eq', 'lte', 'gte', 'lt', 'not', 'limit']
        for (const m of methods) {
          inner[m] = vi.fn().mockReturnValue(inner)
        }
        inner.then = (resolve: (v: { data: unknown; error: null }) => unknown) =>
          Promise.resolve({ data, error: null }).then(resolve)
        return inner
      })
      return obj
    })(),
    study_sessions: (() => {
      let callCount = 0
      const obj: Record<string, unknown> = {}
      obj.select = vi.fn().mockImplementation(() => {
        callCount++
        const data = callCount === 1 ? thisWeekSessions : lastWeekSessions
        const inner: Record<string, unknown> = {}
        const methods = ['eq', 'gte', 'lt']
        for (const m of methods) {
          inner[m] = vi.fn().mockReturnValue(inner)
        }
        inner.then = (resolve: (v: { data: unknown; error: null }) => unknown) =>
          Promise.resolve({ data, error: null }).then(resolve)
        return inner
      })
      return obj
    })(),
    concepts: makeQuery([{ id: weakestConceptId, title: writeConceptTitle }]),
    exercises: makeQuery(
      mistakeExerciseIds.map((id) => ({ id, concept_id: 'concept-mistake-1' }))
    ),
  }

  return {
    from: vi.fn().mockImplementation((table: string) => fromMap[table]),
  }
}

describe('DashboardDeferredSection', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock() as unknown as Awaited<ReturnType<typeof createClient>>
    )
  })

  it('renders WeeklySnapshot when user has studied this week', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        thisWeekAttempts: [
          { ai_score: 3 },
          { ai_score: 2 },
          { ai_score: 1 },
        ],
      }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText('exercises')).toBeTruthy()
  })

  it('skips WeeklySnapshot when user has no attempts this week', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({ thisWeekAttempts: [] }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.queryByText('exercises')).toBeNull()
  })

  it('renders free write card with concept title when weakest concept exists', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({ writeConceptTitle: 'El Subjuntivo' }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText('El Subjuntivo')).toBeTruthy()
    expect(screen.getByText(/write about this/i)).toBeTruthy()
  })

  it('renders generic free write card when no weakest concept', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({ weakestConceptId: '' }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText(/practice your writing/i)).toBeTruthy()
  })

  it('renders SprintCard always for non-new users', async () => {
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByRole('button', { name: /sprint 10 min/i })).toBeTruthy()
  })

  it('renders ReviewMistakes card when mistakeConceptCount > 0', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        mistakeExerciseIds: ['ex-1', 'ex-2'],
      }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText(/review mistakes/i)).toBeTruthy()
    expect(screen.getByText(/to revisit/i)).toBeTruthy()
  })

  it('skips ReviewMistakes card when no mistakes', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({ mistakeExerciseIds: [] }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.queryByText(/to revisit/i)).toBeNull()
  })

  it('hides all deferred cards for new users', async () => {
    const el = await DashboardDeferredSection({ ...defaultProps, isNewUser: true })
    render(el)
    expect(screen.queryByText(/free write/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /sprint 10 min/i })).toBeNull()
    expect(screen.queryByText(/to revisit/i)).toBeNull()
  })
})

describe('DashboardDeferredSkeleton', () => {
  it('renders three placeholder divs', () => {
    const { container } = render(<DashboardDeferredSkeleton />)
    const placeholders = container.querySelectorAll('.animate-pulse')
    expect(placeholders.length).toBe(3)
  })
})
