import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PronunciationSummary } from '../PronunciationSummary'
import type { PronunciationResult } from '@/lib/azure/client'

vi.mock('next/link', () => ({
  __esModule: true,
  default: (props: { children: React.ReactNode; href: string; className?: string }) => {
    const { children, href, ...rest } = props
    return <a href={href} {...rest}>{children}</a>
  },
}))

function makeResult(overrides: Partial<PronunciationResult> = {}): PronunciationResult {
  return {
    overallScore: 75,
    fluencyScore: 70,
    prosodyScore: 80,
    words: [],
    ...overrides,
  }
}

describe('PronunciationSummary', () => {
  it('returns null when no results', () => {
    const { container } = render(
      <PronunciationSummary results={[]} sessionUrl="/pronunciation/session" />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders average overall score in heading', () => {
    const results = [
      makeResult({ overallScore: 80, fluencyScore: 80, prosodyScore: 80 }),
      makeResult({ overallScore: 60, fluencyScore: 60, prosodyScore: 60 }),
    ]
    render(<PronunciationSummary results={results} sessionUrl="/pronunciation/session" />)
    // The heading shows the overall average — use the senda-heading class to target it
    const heading = document.querySelector('.senda-heading')
    expect(heading?.textContent).toBe('70%')
  })

  it('renders item count', () => {
    const results = [makeResult(), makeResult(), makeResult()]
    render(<PronunciationSummary results={results} sessionUrl="/pronunciation/session" />)
    expect(screen.getByText('3 frases evaluadas')).toBeInTheDocument()
  })

  it('renders dimension breakdown sorted worst-first', () => {
    const results = [makeResult({ overallScore: 90, fluencyScore: 50, prosodyScore: 70 })]
    render(<PronunciationSummary results={results} sessionUrl="/pronunciation/session" />)
    const labels = screen.getAllByText(/Precisión|Fluidez|Prosodia/)
    expect(labels[0].textContent).toBe('Fluidez')
    expect(labels[1].textContent).toBe('Prosodia')
    expect(labels[2].textContent).toBe('Precisión')
  })

  it('renders practice again CTA with session URL', () => {
    render(<PronunciationSummary results={[makeResult()]} sessionUrl="/pronunciation/session?foo=bar" />)
    const link = screen.getByRole('link', { name: /Practicar de Nuevo/i })
    expect(link).toHaveAttribute('href', '/pronunciation/session?foo=bar')
  })

  it('renders link to pronunciation hub', () => {
    render(<PronunciationSummary results={[makeResult()]} sessionUrl="/pronunciation/session" />)
    expect(screen.getByRole('link', { name: /Ver Progreso/i })).toHaveAttribute('href', '/pronunciation')
  })

  it('renders link to dashboard', () => {
    render(<PronunciationSummary results={[makeResult()]} sessionUrl="/pronunciation/session" />)
    expect(screen.getByRole('link', { name: /Volver al Inicio/i })).toHaveAttribute('href', '/dashboard')
  })
})
