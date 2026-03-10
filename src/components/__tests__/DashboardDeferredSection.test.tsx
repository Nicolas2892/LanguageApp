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
  isNewUser: false,
  thisWeekStart: THIS_WEEK,
  lastWeekStart: LAST_WEEK,
}

function makeSupabaseMock({
  weakestConceptId = 'concept-abc',
  mistakeExerciseIds = [] as string[],
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
      // call 1: weakest concept query; call 2+: allProgress for curriculum
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
            : []
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
    exercise_attempts: makeQuery(mistakeExerciseIds.map((id) => ({ exercise_id: id }))),
    concepts: makeQuery([{ id: weakestConceptId, title: writeConceptTitle }]),
    exercises: makeQuery(
      mistakeExerciseIds.map((id) => ({ id, concept_id: 'concept-mistake-1' }))
    ),
    modules: makeQuery([{ id: 'mod-1', title: 'Conectores del Discurso', order_index: 1 }]),
    units: makeQuery([{ id: 'unit-1', module_id: 'mod-1' }]),
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

  it('renders free write card with concept title when weakest concept exists', async () => {
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText('El Subjuntivo')).toBeTruthy()
    expect(screen.getByText(/escribir ahora/i)).toBeTruthy()
  })

  it('renders generic free write card when no weakest concept', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({ weakestConceptId: '' }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText(/practica tu escritura/i)).toBeTruthy()
  })

  it('renders Escritura Libre card for non-new users', async () => {
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText('Escritura Libre')).toBeTruthy()
  })

  it('renders ReviewMistakes card when mistakeConceptCount > 0', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        mistakeExerciseIds: ['ex-1', 'ex-2'],
      }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText(/revisar errores/i)).toBeTruthy()
    expect(screen.getByText(/para revisar/i)).toBeTruthy()
  })

  it('skips ReviewMistakes card when no mistakes', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({ mistakeExerciseIds: [] }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.queryByText(/para revisar/i)).toBeNull()
  })

  it('hides all deferred cards for new users', async () => {
    const el = await DashboardDeferredSection({ ...defaultProps, isNewUser: true })
    render(el)
    expect(screen.queryByText('Escritura Libre')).toBeNull()
    expect(screen.queryByText(/para revisar/i)).toBeNull()
  })

  it('renders Tu Currículo section with module states', async () => {
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText('Tu Currículo')).toBeTruthy()
    expect(screen.getByText('Conectores del Discurso')).toBeTruthy()
    // No user_progress for the concept → state is Próximamente
    expect(screen.getByText('Próximamente')).toBeTruthy()
  })
})

describe('DashboardDeferredSkeleton', () => {
  it('renders three placeholder divs', () => {
    const { container } = render(<DashboardDeferredSkeleton />)
    const placeholders = container.querySelectorAll('.animate-senda-pulse')
    expect(placeholders.length).toBe(3)
  })
})
