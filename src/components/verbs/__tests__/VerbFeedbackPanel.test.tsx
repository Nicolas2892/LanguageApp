import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerbFeedbackPanel } from '../VerbFeedbackPanel'

const baseResult = {
  userAnswer: 'hablo',
  correctForm: 'habló',
  tenseRule: 'Present tense: -ar verbs use -o, -as, -a, -amos, -áis, -an',
}

describe('VerbFeedbackPanel', () => {
  it('renders correct state', () => {
    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'correct', correctForm: 'habló' }}
        onNext={vi.fn()}
        onTryAgain={vi.fn()}
        isLast={false}
      />
    )
    expect(screen.getByText('Correct!')).toBeInTheDocument()
    expect(screen.getByText('habló')).toBeInTheDocument()
  })

  it('renders accent_error state with Next button', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()

    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'accent_error' }}
        onNext={onNext}
        onTryAgain={vi.fn()}
        isLast={false}
      />
    )
    expect(screen.getByText(/Almost — check your accents/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Next/ }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('renders accent_error Finish button on last item', () => {
    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'accent_error' }}
        onNext={vi.fn()}
        onTryAgain={vi.fn()}
        isLast={true}
      />
    )
    expect(screen.getByRole('button', { name: /Finish/ })).toBeInTheDocument()
  })

  it('renders incorrect state with tense rule and both buttons', async () => {
    const onTryAgain = vi.fn()
    const onNext = vi.fn()
    const user = userEvent.setup()

    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'incorrect' }}
        onNext={onNext}
        onTryAgain={onTryAgain}
        isLast={false}
      />
    )

    expect(screen.getByText(/Not quite/)).toBeInTheDocument()
    expect(screen.getByText(baseResult.tenseRule)).toBeInTheDocument()

    await user.click(screen.getByTestId('try-again-btn'))
    expect(onTryAgain).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: /Next/ }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('shows Finish instead of Next on last incorrect item', () => {
    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'incorrect' }}
        onNext={vi.fn()}
        onTryAgain={vi.fn()}
        isLast={true}
      />
    )
    expect(screen.getByRole('button', { name: /Finish/ })).toBeInTheDocument()
  })
})
