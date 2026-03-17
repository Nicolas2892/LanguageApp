import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConjugationInsightTable } from '../ConjugationInsightTable'

// ─── ConjugationInsightTable unit tests ──────────────────────────────────────

describe('ConjugationInsightTable', () => {
  const rows = [
    { pronoun: 'yo',       form: 'hablo',    stem: 'habl' },
    { pronoun: 'nosotros', form: 'hablamos', stem: 'habl' },
    { pronoun: 'ellos',    form: 'hablan',   stem: 'habl' },
  ]

  it('renders all pronoun labels', () => {
    render(<ConjugationInsightTable rows={rows} />)
    expect(screen.getByText('yo')).toBeInTheDocument()
    expect(screen.getByText('nosotros')).toBeInTheDocument()
    expect(screen.getByText('ellos')).toBeInTheDocument()
  })

  it('renders stem part and ending part for regular verbs', () => {
    render(<ConjugationInsightTable rows={[rows[0]]} />)
    // stem 'habl' renders in muted span; ending 'o' in terracotta span
    expect(screen.getByText('habl')).toBeInTheDocument()
    expect(screen.getByText('o')).toBeInTheDocument()
  })

  it('colours whole form terracotta for fully irregular stem (empty string)', () => {
    const { container } = render(
      <ConjugationInsightTable rows={[{ pronoun: 'yo', form: 'soy', stem: '' }]} />
    )
    // With empty stem, only a single span is rendered containing the full form
    const spans = container.querySelectorAll('span[style*="terracotta"]')
    expect(spans.length).toBeGreaterThanOrEqual(1)
    expect(spans[0].textContent).toBe('soy')
  })
})

// ─── ConceptDetailPage async server component tests ──────────────────────────

// Mock all external dependencies
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
  redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT') }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/components/SpeakButton', () => ({
  SpeakButton: () => <button>Speak</button>,
}))

vi.mock('@/components/GrammarFocusChip', () => ({
  GrammarFocusChip: ({ focus }: { focus: string | null }) => <span>{focus}</span>,
}))

vi.mock('@/components/LevelChip', () => ({
  LevelChip: ({ level }: { level: string | null }) => <span>{level}</span>,
}))

vi.mock('@/components/HardFlagButton', () => ({
  HardFlagButton: ({ conceptId }: { conceptId: string }) => (
    <button data-testid={`hard-flag-${conceptId}`}>Flag</button>
  ),
}))

vi.mock('@/components/WindingPathSeparator', () => ({
  WindingPathSeparator: () => <hr />,
}))

vi.mock('@/components/BackgroundMagicS', () => ({
  BackgroundMagicS: () => null,
}))

vi.mock('../ConceptDetailClient', () => ({
  ExpandableExplanation: ({ text }: { text: string }) => <p>{text}</p>,
}))

// Concept fixture
const CONCEPT_BASE = {
  id: 'con-1',
  unit_id: 'unit-1',
  title: 'Sin embargo',
  explanation: 'Used to contrast two ideas.',
  level: 'B1',
  grammar_focus: null,
  examples: [{ es: 'Sin embargo, no pudo.', en: 'However, he could not.' }],
}

// Tense-mapped concept fixture
const CONCEPT_TENSE = {
  ...CONCEPT_BASE,
  id: 'con-tense',
  title: 'Usos del pretérito indefinido',
  explanation: 'The preterite tense is used for completed past actions.',
}

type MockSupabase = {
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> }
  from: (table: string) => MockQueryBuilder
}

type MockQueryBuilder = {
  select: (...args: unknown[]) => MockQueryBuilder
  eq: (...args: unknown[]) => MockQueryBuilder
  in: (...args: unknown[]) => MockQueryBuilder
  single: () => Promise<{ data: unknown }>
  maybeSingle: () => Promise<{ data: unknown }>
  count?: number
}

function makeMockSupabase(overrides?: {
  conceptData?: unknown
  hablarData?: unknown
  conjData?: unknown
  progressData?: unknown
}): MockSupabase {
  const concept = overrides?.conceptData ?? CONCEPT_BASE

  return {
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } } }),
    },
    from: (table: string) => {
      const builder: MockQueryBuilder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        single: async () => {
          if (table === 'concepts') return { data: concept }
          if (table === 'units') return { data: { id: 'unit-1', title: 'Unidad Pasado', module_id: 'mod-1' } }
          if (table === 'modules') return { data: { title: 'Pasado' } }
          if (table === 'verbs') return { data: overrides?.hablarData ?? null }
          if (table === 'verb_conjugations') return { data: overrides?.conjData ?? null }
          return { data: null }
        },
        maybeSingle: async () => {
          if (table === 'user_progress') {
            return { data: overrides?.progressData ?? null }
          }
          return { data: null }
        },
      }
      // For exercises and exercise_attempts queries that don't use single/maybeSingle
      ;(builder as MockQueryBuilder & { data?: unknown; count?: number }).data = []
      ;(builder as MockQueryBuilder & { count?: number }).count = 0
      return builder
    },
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import ConceptDetailPage from '../page'

describe('ConceptDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders concept title and explanation for a non-tense concept', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase() as never)
    const el = await ConceptDetailPage({
      params: Promise.resolve({ id: 'con-1' }),
      searchParams: Promise.resolve({}),
    })
    render(el)
    expect(screen.getByText('Sin embargo')).toBeInTheDocument()
    expect(screen.getByText('Used to contrast two ideas.')).toBeInTheDocument()
    // No conjugation card for this concept
    expect(screen.queryByText('Conjugación de ejemplo')).not.toBeInTheDocument()
  })

  it('renders Ejemplos section when concept has examples', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase() as never)
    const el = await ConceptDetailPage({
      params: Promise.resolve({ id: 'con-1' }),
      searchParams: Promise.resolve({}),
    })
    render(el)
    expect(screen.getByText('Ejemplos')).toBeInTheDocument()
    expect(screen.getByText('Sin embargo, no pudo.')).toBeInTheDocument()
  })

  it('renders SRS status section', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase() as never)
    const el = await ConceptDetailPage({
      params: Promise.resolve({ id: 'con-1' }),
      searchParams: Promise.resolve({}),
    })
    render(el)
    expect(screen.getByText('Próxima revisión')).toBeInTheDocument()
    expect(screen.getByText('No comenzado')).toBeInTheDocument()
  })

  it('renders conjugation insight section when concept is tense-mapped and hablar found', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeMockSupabase({
        conceptData: CONCEPT_TENSE,
        hablarData: { id: 'verb-hablar-id' },
        conjData: {
          stem: 'habl',
          yo: 'hablé',
          tu: 'hablaste',
          el: 'habló',
          nosotros: 'hablamos',
          vosotros: 'hablasteis',
          ellos: 'hablaron',
        },
      }) as never
    )
    const el = await ConceptDetailPage({
      params: Promise.resolve({ id: 'con-tense' }),
      searchParams: Promise.resolve({}),
    })
    render(el)
    expect(screen.getByText('Conjugación de ejemplo')).toBeInTheDocument()
    expect(screen.getByText(/hablar/)).toBeInTheDocument()
    expect(screen.getByText('yo')).toBeInTheDocument()
  })

  it('does not render conjugation section when hablar not found in DB', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeMockSupabase({
        conceptData: CONCEPT_TENSE,
        hablarData: null,
        conjData: null,
      }) as never
    )
    const el = await ConceptDetailPage({
      params: Promise.resolve({ id: 'con-tense' }),
      searchParams: Promise.resolve({}),
    })
    render(el)
    expect(screen.queryByText('Conjugación de ejemplo')).not.toBeInTheDocument()
  })

  it('renders explanation section with Cómo funciona eyebrow', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase() as never)
    const el = await ConceptDetailPage({
      params: Promise.resolve({ id: 'con-1' }),
      searchParams: Promise.resolve({}),
    })
    render(el)
    expect(screen.getByText('Cómo funciona')).toBeInTheDocument()
  })

  it('renders three-tier CTA layout', async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase() as never)
    const el = await ConceptDetailPage({
      params: Promise.resolve({ id: 'con-1' }),
      searchParams: Promise.resolve({}),
    })
    render(el)
    expect(screen.getByText('Practica este concepto →')).toBeInTheDocument()
    expect(screen.getByText('Escritura libre')).toBeInTheDocument()
    expect(screen.getByText('Consultar tutor')).toBeInTheDocument()
  })
})
