import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportAttemptRow } from '../ReportAttemptRow'
import type { OfflineReportAttempt } from '@/lib/supabase/types'

function makeAttempt(overrides: Partial<OfflineReportAttempt> = {}): OfflineReportAttempt {
  return {
    id: 'a1',
    report_id: 'r1',
    exercise_id: 'e1',
    concept_id: 'c1',
    concept_title: 'Ser vs Estar',
    exercise_type: 'translation',
    exercise_prompt: 'Translate: The house is big',
    user_answer: 'La casa es grande',
    score: 3,
    is_correct: true,
    feedback: 'Perfect translation.',
    corrected_version: '',
    explanation: '',
    attempted_at: '2026-03-15T14:30:00Z',
    ...overrides,
  }
}

describe('ReportAttemptRow', () => {
  it('renders exercise type label and concept title', () => {
    render(<ReportAttemptRow attempt={makeAttempt()} />)
    expect(screen.getByText('Traducción')).toBeInTheDocument()
    expect(screen.getByText('Ser vs Estar')).toBeInTheDocument()
  })

  it('renders prompt and user answer', () => {
    render(<ReportAttemptRow attempt={makeAttempt()} />)
    expect(screen.getByText('Translate: The house is big')).toBeInTheDocument()
    expect(screen.getByText('La casa es grande')).toBeInTheDocument()
  })

  it('renders score badge with label', () => {
    render(<ReportAttemptRow attempt={makeAttempt({ score: 3 })} />)
    expect(screen.getByText('Perfecto')).toBeInTheDocument()
  })

  it('renders feedback when provided', () => {
    render(<ReportAttemptRow attempt={makeAttempt({ feedback: 'Great job!' })} />)
    expect(screen.getByText('Great job!')).toBeInTheDocument()
  })

  it('renders corrected version for incorrect answers', () => {
    render(
      <ReportAttemptRow
        attempt={makeAttempt({
          is_correct: false,
          score: 0,
          corrected_version: 'La casa está grande',
        })}
      />,
    )
    expect(screen.getByText(/La casa está grande/)).toBeInTheDocument()
  })

  it('does not render corrected version for correct answers', () => {
    render(
      <ReportAttemptRow
        attempt={makeAttempt({
          is_correct: true,
          corrected_version: 'La casa es grande',
        })}
      />,
    )
    // corrected_version not shown when is_correct
    expect(screen.queryByText(/✓ La casa es grande/)).not.toBeInTheDocument()
  })

  it('renders explanation when provided', () => {
    render(
      <ReportAttemptRow
        attempt={makeAttempt({ explanation: 'Use ser for inherent qualities.' })}
      />,
    )
    expect(screen.getByText('Use ser for inherent qualities.')).toBeInTheDocument()
  })

  it('falls back to raw type for unknown exercise types', () => {
    render(<ReportAttemptRow attempt={makeAttempt({ exercise_type: 'custom_type' })} />)
    expect(screen.getByText('custom_type')).toBeInTheDocument()
  })
})
