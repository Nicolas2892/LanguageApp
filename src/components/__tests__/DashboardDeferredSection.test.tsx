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
  writeConceptTitle = 'El Subjuntivo',
} = {}) {
  const makeQuery = (data: unknown[]) => {
    const obj: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'lte', 'lt', 'gte', 'not', 'order', 'limit', 'in', 'single']
    for (const m of methods) {
      obj[m] = vi.fn().mockReturnValue(obj)
    }
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
    concepts: makeQuery([{ id: weakestConceptId, title: writeConceptTitle }]),
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
    expect(screen.getByText(/el subjuntivo/i)).toBeTruthy()
    expect(screen.getByText(/empezar a escribir/i)).toBeTruthy()
  })

  it('renders generic free write card when no weakest concept', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({ weakestConceptId: '' }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText(/expresa tus ideas/i)).toBeTruthy()
  })

  it('renders Escritura Libre card for non-new users', async () => {
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText('Escritura Libre')).toBeTruthy()
  })

  it('does not render Revisar Errores card', async () => {
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.queryByText(/revisar errores/i)).toBeNull()
  })

  it('hides all deferred cards for new users', async () => {
    const el = await DashboardDeferredSection({ ...defaultProps, isNewUser: true })
    render(el)
    expect(screen.queryByText('Escritura Libre')).toBeNull()
  })

  it('renders Tu Currículo section with module states', async () => {
    const el = await DashboardDeferredSection(defaultProps)
    render(el)
    expect(screen.getByText('Tu Currículo')).toBeTruthy()
    expect(screen.getByText('Conectores del Discurso')).toBeTruthy()
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
