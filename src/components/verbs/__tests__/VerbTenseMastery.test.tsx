import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerbTenseMastery } from '../VerbTenseMastery'

describe('VerbTenseMastery', () => {
  it('renders empty state when summaries is empty', () => {
    render(<VerbTenseMastery summaries={[]} />)
    expect(screen.getByText('Verbos por Tiempo')).toBeInTheDocument()
    expect(
      screen.getByText('Completa ejercicios de verbos para ver tu progreso.')
    ).toBeInTheDocument()
  })

  it('renders a row for each tense summary', () => {
    const summaries = [
      { tense: 'present_indicative', correct: 80, attempts: 100, pct: 80 },
      { tense: 'preterite',          correct: 30, attempts:  50, pct: 60 },
    ]
    render(<VerbTenseMastery summaries={summaries} />)

    expect(screen.getByText('Presente de Indicativo')).toBeInTheDocument()
    expect(screen.getByText('Pretérito Indefinido')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('100 intentos')).toBeInTheDocument()
    expect(screen.getByText('50 intentos')).toBeInTheDocument()
  })

  it('renders section eyebrow', () => {
    const summaries = [{ tense: 'imperfect', correct: 5, attempts: 10, pct: 50 }]
    render(<VerbTenseMastery summaries={summaries} />)
    expect(screen.getByText('Verbos por Tiempo')).toBeInTheDocument()
  })
})
