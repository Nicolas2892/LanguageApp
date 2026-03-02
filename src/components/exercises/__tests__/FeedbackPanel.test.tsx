import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackPanel } from '../FeedbackPanel'

const baseResult = {
  score: 3 as const,
  is_correct: true,
  feedback: 'Great job!',
  corrected_version: '',
  explanation: 'You used the connector correctly.',
  next_review_in_days: 6,
}

describe('FeedbackPanel', () => {
  it('shows score label for each score', () => {
    const labels = ['Incorrect', 'Needs work', 'Good', 'Perfect'] as const
    labels.forEach((label, score) => {
      const { unmount } = render(
        <FeedbackPanel
          result={{ ...baseResult, score: score as 0 | 1 | 2 | 3, is_correct: score >= 2 }}
          userAnswer="mi respuesta"
          onNext={vi.fn()}
          isLast={false}
        />
      )
      expect(screen.getByText(label)).toBeTruthy()
      unmount()
    })
  })

  it('shows "Next →" when not last', () => {
    render(
      <FeedbackPanel result={baseResult} userAnswer="test" onNext={vi.fn()} isLast={false} />
    )
    expect(screen.getByText('Next →')).toBeTruthy()
  })

  it('shows "Finish session" when last', () => {
    render(
      <FeedbackPanel result={baseResult} userAnswer="test" onNext={vi.fn()} isLast={true} />
    )
    expect(screen.getByText('Finish session')).toBeTruthy()
  })

  it('calls onNext when Next button is clicked', async () => {
    const onNext = vi.fn()
    render(
      <FeedbackPanel result={baseResult} userAnswer="test" onNext={onNext} isLast={false} />
    )
    await userEvent.click(screen.getByText('Next →'))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('shows Try again button when onTryAgain provided', () => {
    render(
      <FeedbackPanel
        result={baseResult}
        userAnswer="test"
        onNext={vi.fn()}
        onTryAgain={vi.fn()}
        isLast={false}
      />
    )
    expect(screen.getByText('Try again')).toBeTruthy()
  })

  it('does not show correct answer when answer is correct', () => {
    render(
      <FeedbackPanel
        result={{ ...baseResult, is_correct: true }}
        userAnswer="sin embargo"
        onNext={vi.fn()}
        isLast={false}
      />
    )
    expect(screen.queryByText('Correct:')).toBeNull()
  })

  it('shows corrected version when answer is wrong', () => {
    render(
      <FeedbackPanel
        result={{ ...baseResult, score: 0, is_correct: false, corrected_version: 'sin embargo' }}
        userAnswer="sin embargo,"
        onNext={vi.fn()}
        isLast={false}
      />
    )
    expect(screen.getByText('sin embargo')).toBeTruthy()
  })

  it('shows next review countdown', () => {
    render(
      <FeedbackPanel result={{ ...baseResult, next_review_in_days: 1 }} userAnswer="test" onNext={vi.fn()} isLast={false} />
    )
    expect(screen.getByText(/Back in 1 day/)).toBeTruthy()
  })
})
