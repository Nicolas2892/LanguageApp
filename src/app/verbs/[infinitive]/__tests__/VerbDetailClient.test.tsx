import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerbDetailClient } from '../VerbDetailClient'
import type { CSSProperties } from 'react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/verbs/hablar',
}))

// Mock VerbFavoriteButton (network-dependent)
vi.mock('@/components/verbs/VerbFavoriteButton', () => ({
  VerbFavoriteButton: ({ verbId }: { verbId: string }) => (
    <button data-testid="fav-btn" data-verb-id={verbId}>fav</button>
  ),
}))

// Mock AnimatedBar (avoid mount-delay timer)
vi.mock('@/components/AnimatedBar', () => ({
  AnimatedBar: ({ pct, style }: { pct: number; className?: string; style?: CSSProperties }) => (
    <div data-testid="animated-bar" data-pct={pct} style={style} />
  ),
}))

// Mock WindingPathSeparator
vi.mock('@/components/WindingPathSeparator', () => ({
  WindingPathSeparator: () => <div data-testid="winding-path-separator" />,
}))

const makeTenseData = (overrides: Partial<{
  tense: string
  rows: { pronoun: string; form: string; stem: string }[]
  masteryPct: number | null
  attempts: number
}> = {}) => ({
  tense: 'present_indicative',
  rows: [
    { pronoun: 'yo',       form: 'hablo',    stem: 'habl' },
    { pronoun: 'tu',       form: 'hablas',   stem: 'habl' },
    { pronoun: 'el',       form: 'habla',    stem: 'habl' },
    { pronoun: 'nosotros', form: 'hablamos', stem: 'habl' },
    { pronoun: 'vosotros', form: 'habláis',  stem: 'habl' },
    { pronoun: 'ellos',    form: 'hablan',   stem: 'habl' },
  ],
  masteryPct: null,
  attempts: 0,
  ...overrides,
})

const defaultProps = {
  verbId: '00000000-0000-0000-0000-000000000001',
  infinitive: 'hablar',
  english: 'to speak',
  verbGroup: 'ar',
  favorited: false,
  tenseData: [
    makeTenseData(),
    makeTenseData({ tense: 'preterite', rows: [], masteryPct: null, attempts: 0 }),
    makeTenseData({ tense: 'imperfect', rows: [], masteryPct: null, attempts: 0 }),
    makeTenseData({ tense: 'future', rows: [], masteryPct: null, attempts: 0 }),
    makeTenseData({ tense: 'conditional', rows: [], masteryPct: null, attempts: 0 }),
    makeTenseData({ tense: 'present_subjunctive', rows: [], masteryPct: null, attempts: 0 }),
    makeTenseData({ tense: 'imperfect_subjunctive', rows: [], masteryPct: null, attempts: 0 }),
    makeTenseData({ tense: 'imperative_affirmative', rows: [], masteryPct: null, attempts: 0 }),
    makeTenseData({ tense: 'imperative_negative', rows: [], masteryPct: null, attempts: 0 }),
  ],
}

beforeEach(() => {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => { store[k] = v }),
    removeItem: vi.fn((k: string) => { delete store[k] }),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  })
})

describe('VerbDetailClient', () => {
  it('renders infinitive and english translation', () => {
    render(<VerbDetailClient {...defaultProps} />)
    expect(screen.getByText('hablar')).toBeInTheDocument()
    expect(screen.getByText('to speak')).toBeInTheDocument()
  })

  it('renders verb group badge', () => {
    render(<VerbDetailClient {...defaultProps} />)
    expect(screen.getByText('-ar')).toBeInTheDocument()
  })

  it('renders mood group labels', () => {
    render(<VerbDetailClient {...defaultProps} />)
    expect(screen.getByText('Indicativo')).toBeInTheDocument()
    expect(screen.getByText('Subjuntivo')).toBeInTheDocument()
    expect(screen.getByText('Imperativo')).toBeInTheDocument()
  })

  it('selects first tense (Presente) by default', () => {
    render(<VerbDetailClient {...defaultProps} />)
    const tabs = screen.getAllByRole('tab')
    // First Presente tab (under Indicativo) should be active
    const presenteTab = tabs[0]
    expect(presenteTab).toHaveTextContent('Presente')
    expect(presenteTab).toHaveAttribute('aria-selected', 'true')
  })

  it('switches tense when clicking a different pill', async () => {
    const user = userEvent.setup()
    render(<VerbDetailClient {...defaultProps} />)

    // Presente is active, should show conjugation table
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByText(/Sin datos aún/)).not.toBeInTheDocument()

    // Click Indefinido tab
    const indefinidoTab = screen.getByRole('tab', { name: 'Indefinido' })
    await user.click(indefinidoTab)

    // Indefinido has no rows → should show empty state
    expect(screen.getByText(/Sin datos aún/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(indefinidoTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders all 6 expanded pronoun labels', () => {
    render(<VerbDetailClient {...defaultProps} />)
    expect(screen.getByText('yo')).toBeInTheDocument()
    expect(screen.getByText('tú')).toBeInTheDocument()
    expect(screen.getByText('él/ella/Ud.')).toBeInTheDocument()
    expect(screen.getByText('nosotros/as')).toBeInTheDocument()
    expect(screen.getByText('vosotros/as')).toBeInTheDocument()
    expect(screen.getByText('ellos/as')).toBeInTheDocument()
  })

  it('toggles colour endings (aria-pressed)', async () => {
    const user = userEvent.setup()
    render(<VerbDetailClient {...defaultProps} />)

    const toggleBtn = screen.getByRole('button', { name: 'Alternar terminaciones coloreadas' })
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true')

    await user.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows mastery bar when attempts > 0', () => {
    const propsWithMastery = {
      ...defaultProps,
      tenseData: defaultProps.tenseData.map((d) =>
        d.tense === 'present_indicative'
          ? { ...d, masteryPct: 75, attempts: 20 }
          : d
      ),
    }
    render(<VerbDetailClient {...propsWithMastery} />)
    expect(screen.getByTestId('mastery-bar')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('20 intentos')).toBeInTheDocument()
  })

  it('hides mastery bar when no attempts', () => {
    render(<VerbDetailClient {...defaultProps} />)
    expect(screen.queryByTestId('mastery-bar')).not.toBeInTheDocument()
  })

  it('CTA link points directly to verb session with all tenses', () => {
    render(<VerbDetailClient {...defaultProps} />)
    const cta = screen.getByRole('link', { name: /Practica este verbo/ })
    expect(cta).toHaveAttribute(
      'href',
      '/verbs/session?tenses=present_indicative,preterite,imperfect,future,conditional,present_subjunctive,imperfect_subjunctive,imperative_affirmative,imperative_negative&verbSet=single&verb=hablar&length=10',
    )
  })

  it('renders WindingPathSeparator', () => {
    render(<VerbDetailClient {...defaultProps} />)
    expect(screen.getByTestId('winding-path-separator')).toBeInTheDocument()
  })
})
