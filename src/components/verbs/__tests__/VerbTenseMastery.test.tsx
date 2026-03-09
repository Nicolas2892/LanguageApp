import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerbTenseMastery } from '../VerbTenseMastery'

describe('VerbTenseMastery', () => {
  it('renders nothing when summaries is empty', () => {
    const { container } = render(<VerbTenseMastery summaries={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a row for each tense summary', () => {
    const summaries = [
      { tense: 'present_indicative', correct: 80, attempts: 100, pct: 80 },
      { tense: 'preterite',          correct: 30, attempts:  50, pct: 60 },
    ]
    render(<VerbTenseMastery summaries={summaries} />)

    expect(screen.getByText('Presente de Indicativo')).toBeInTheDocument()
    expect(screen.getByText('Pretérito Indefinido')).toBeInTheDocument()
    expect(screen.getByText('80/100 · 80%')).toBeInTheDocument()
    expect(screen.getByText('30/50 · 60%')).toBeInTheDocument()
  })

  it('renders section heading', () => {
    const summaries = [{ tense: 'imperfect', correct: 5, attempts: 10, pct: 50 }]
    render(<VerbTenseMastery summaries={summaries} />)
    expect(screen.getByText('Verb Conjugation Mastery')).toBeInTheDocument()
  })
})
