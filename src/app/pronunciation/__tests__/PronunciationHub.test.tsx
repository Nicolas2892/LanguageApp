import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PronunciationHub } from '../PronunciationHub'

vi.mock('next/link', () => ({
  __esModule: true,
  default: (props: { children: React.ReactNode; href: string; className?: string }) => {
    const { children, href, ...rest } = props
    return <a href={href} {...rest}>{children}</a>
  },
}))

describe('PronunciationHub', () => {
  it('renders page heading', () => {
    render(<PronunciationHub progress={[]} />)
    expect(screen.getByText('Pronunciación')).toBeInTheDocument()
  })

  it('renders empty state text when no progress', () => {
    render(<PronunciationHub progress={[]} />)
    expect(screen.getByText('Mejora tu acento leyendo frases en voz alta')).toBeInTheDocument()
  })

  it('renders attempt count when progress exists', () => {
    const progress = [
      { category: 'stress', attempt_count: 10, correct_count: 8 },
      { category: 'fluency', attempt_count: 5, correct_count: 3 },
    ]
    render(<PronunciationHub progress={progress} />)
    expect(screen.getByText('15 intentos registrados')).toBeInTheDocument()
  })

  it('renders all 8 pronunciation categories', () => {
    render(<PronunciationHub progress={[]} />)
    expect(screen.getByText('Acentuación')).toBeInTheDocument()
    expect(screen.getByText('Fluidez')).toBeInTheDocument()
    expect(screen.getByText('Prosodia')).toBeInTheDocument()
    expect(screen.getByText('R Vibrante (rr)')).toBeInTheDocument()
    expect(screen.getByText('Jota (J/G)')).toBeInTheDocument()
    expect(screen.getByText('Eñe (Ñ)')).toBeInTheDocument()
    expect(screen.getByText('Vocales')).toBeInTheDocument()
    expect(screen.getByText('Consonantes')).toBeInTheDocument()
  })

  it('renders accuracy percentage for practiced categories', () => {
    const progress = [
      { category: 'stress', attempt_count: 10, correct_count: 8 },
    ]
    render(<PronunciationHub progress={progress} />)
    expect(screen.getByText('80%')).toBeInTheDocument()
  })

  it('shows unpracticed message for categories without attempts', () => {
    render(<PronunciationHub progress={[]} />)
    const msgs = screen.getAllByText(/Comienza a practicar/)
    expect(msgs.length).toBe(8)
  })

  it('sorts practiced categories with lowest accuracy first', () => {
    const progress = [
      { category: 'stress', attempt_count: 10, correct_count: 9 },
      { category: 'fluency', attempt_count: 10, correct_count: 5 },
      { category: 'prosody', attempt_count: 10, correct_count: 7 },
    ]
    render(<PronunciationHub progress={progress} />)
    const percentages = screen.getAllByText(/%/)
    expect(percentages[0].textContent).toBe('50%')
    expect(percentages[1].textContent).toBe('70%')
    expect(percentages[2].textContent).toBe('90%')
  })

  it('renders CTA link to session in read mode', () => {
    render(<PronunciationHub progress={[]} />)
    const link = screen.getByRole('link', { name: /Practicar Pronunciación/i })
    expect(link).toHaveAttribute('href', '/pronunciation/session')
  })

  it('renders mode toggle with Lee la Frase and Sombra', () => {
    render(<PronunciationHub progress={[]} />)
    expect(screen.getByText('Lee la Frase')).toBeInTheDocument()
    expect(screen.getByText('Sombra')).toBeInTheDocument()
  })

  it('switches CTA to shadow session when Sombra selected', async () => {
    const user = userEvent.setup()
    render(<PronunciationHub progress={[]} />)
    await user.click(screen.getByText('Sombra'))
    const link = screen.getByRole('link', { name: /Practicar Sombra/i })
    expect(link).toHaveAttribute('href', '/pronunciation/session?mode=shadow')
  })

  it('shows mode description for read mode', () => {
    render(<PronunciationHub progress={[]} />)
    expect(screen.getByText(/Lee la frase en voz alta/)).toBeInTheDocument()
  })

  it('shows mode description for shadow mode', async () => {
    const user = userEvent.setup()
    render(<PronunciationHub progress={[]} />)
    await user.click(screen.getByText('Sombra'))
    expect(screen.getByText(/Escucha primero al nativo/)).toBeInTheDocument()
  })
})
