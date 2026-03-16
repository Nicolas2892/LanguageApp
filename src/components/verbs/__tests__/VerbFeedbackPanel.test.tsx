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
    expect(screen.getByText('¡Correcto!')).toBeInTheDocument()
    expect(screen.getByText('habló')).toBeInTheDocument()
  })

  it('renders accent_error state with Siguiente button', async () => {
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
    expect(screen.getByText(/Casi — revisa los acentos/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('renders accent_error Finalizar button on last item', () => {
    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'accent_error' }}
        onNext={vi.fn()}
        onTryAgain={vi.fn()}
        isLast={true}
      />
    )
    expect(screen.getByRole('button', { name: /Finalizar sesión/ })).toBeInTheDocument()
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

    expect(screen.getByText('Incorrecto')).toBeInTheDocument()
    expect(screen.getByText(baseResult.tenseRule)).toBeInTheDocument()

    await user.click(screen.getByTestId('try-again-btn'))
    expect(onTryAgain).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('shows Finalizar instead of Siguiente on last incorrect item', () => {
    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'incorrect' }}
        onNext={vi.fn()}
        onTryAgain={vi.fn()}
        isLast={true}
      />
    )
    expect(screen.getByRole('button', { name: /Finalizar sesión/ })).toBeInTheDocument()
  })

  it('renders completedSentence when provided', () => {
    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'correct', correctForm: 'habló' }}
        onNext={vi.fn()}
        onTryAgain={vi.fn()}
        isLast={false}
        completedSentence="Yo habló español todos los días."
      />
    )
    expect(screen.getByText('Yo habló español todos los días.')).toBeInTheDocument()
  })

  it('renders tenseRule for correct outcome', () => {
    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'correct', correctForm: 'habló' }}
        onNext={vi.fn()}
        onTryAgain={vi.fn()}
        isLast={false}
      />
    )
    expect(screen.getByText(baseResult.tenseRule)).toBeInTheDocument()
  })

  it('renders tenseRule for accent_error outcome', () => {
    render(
      <VerbFeedbackPanel
        result={{ ...baseResult, outcome: 'accent_error' }}
        onNext={vi.fn()}
        onTryAgain={vi.fn()}
        isLast={false}
      />
    )
    expect(screen.getByText(baseResult.tenseRule)).toBeInTheDocument()
  })
})
