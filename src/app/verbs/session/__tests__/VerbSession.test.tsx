import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerbSession } from '../VerbSession'
import type { SessionItem } from '../VerbSession'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const makeItem = (overrides: Partial<SessionItem> = {}): SessionItem => ({
  verbId:      '00000000-0000-0000-0000-000000000001',
  infinitive:  'hablar',
  tense:       'present_indicative',
  pronoun:     'yo',
  sentence:    'Yo _____ español todos los días.',
  correctForm: 'hablo',
  tenseRule:   '-ar verbs: yo → -o',
  ...overrides,
})

describe('VerbSession', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the first question', () => {
    render(
      <VerbSession
        items={[makeItem()]}
        showHint={true}
        sessionUrl="/verbs/session?test"
      />
    )
    expect(screen.getByText(/español todos los días/)).toBeInTheDocument()
    expect(screen.getByText('[hablar]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Comprobar/ })).toBeInTheDocument()
  })

  it('disables Comprobar button when input is empty', () => {
    render(
      <VerbSession
        items={[makeItem()]}
        showHint={false}
        sessionUrl="/verbs/session?test"
      />
    )
    expect(screen.getByRole('button', { name: /Comprobar/ })).toBeDisabled()
  })

  it('shows correct feedback on right answer', async () => {
    const user = userEvent.setup()

    render(
      <VerbSession
        items={[makeItem()]}
        showHint={true}
        sessionUrl="/verbs/session?test"
      />
    )

    await user.type(screen.getByPlaceholderText(/Type the conjugated form/), 'hablo')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    expect(screen.getByText('¡Correcto!')).toBeInTheDocument()
  })

  it('shows accent_error feedback for missing accent', async () => {
    const user = userEvent.setup()

    render(
      <VerbSession
        items={[makeItem({ correctForm: 'habló' })]}
        showHint={true}
        sessionUrl="/verbs/session?test"
      />
    )

    await user.type(screen.getByPlaceholderText(/Type the conjugated form/), 'hablo')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    expect(screen.getByText(/Casi — revisa los acentos/)).toBeInTheDocument()
  })

  it('shows incorrect feedback on wrong answer', async () => {
    const user = userEvent.setup()

    render(
      <VerbSession
        items={[makeItem()]}
        showHint={true}
        sessionUrl="/verbs/session?test"
      />
    )

    await user.type(screen.getByPlaceholderText(/Type the conjugated form/), 'hablas')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    expect(screen.getByText('Incorrecto')).toBeInTheDocument()
    expect(screen.getByTestId('try-again-btn')).toBeInTheDocument()
  })

  it('Try Again clears input and returns to answering phase', async () => {
    const user = userEvent.setup()

    render(
      <VerbSession
        items={[makeItem()]}
        showHint={true}
        sessionUrl="/verbs/session?test"
      />
    )

    await user.type(screen.getByPlaceholderText(/Type the conjugated form/), 'hablas')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    await user.click(screen.getByTestId('try-again-btn'))

    expect(screen.getByPlaceholderText(/Type the conjugated form/)).toHaveValue('')
    expect(screen.getByRole('button', { name: /Comprobar/ })).toBeInTheDocument()
  })

  it('shows done screen after last item is answered incorrectly and Finalizar is clicked', async () => {
    const user = userEvent.setup()

    render(
      <VerbSession
        items={[makeItem()]}
        showHint={false}
        sessionUrl="/verbs/session?test"
      />
    )

    // Give a wrong answer so we get manual Next (not auto-advance)
    await user.type(screen.getByPlaceholderText(/Type the conjugated form/), 'hablas')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    // Click "Finalizar sesión" on the last item
    await user.click(screen.getByRole('button', { name: /Finalizar sesión/ }))

    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Practicar de nuevo/ })).toBeInTheDocument()
  })

  it('shows segmented progress dots', () => {
    render(
      <VerbSession
        items={[makeItem(), makeItem({ pronoun: 'tu' })]}
        showHint={false}
        sessionUrl="/verbs/session?test"
      />
    )
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('fires grade API on first attempt', async () => {
    const user = userEvent.setup()

    render(
      <VerbSession
        items={[makeItem()]}
        showHint={false}
        sessionUrl="/verbs/session?test"
      />
    )

    await user.type(screen.getByPlaceholderText(/Type the conjugated form/), 'hablo')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/verbs/grade',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('does not show hint when showHint=false', () => {
    render(
      <VerbSession
        items={[makeItem()]}
        showHint={false}
        sessionUrl="/verbs/session?test"
      />
    )
    expect(screen.queryByText('[hablar]')).not.toBeInTheDocument()
  })

  it('shows exit confirmation dialog when X is clicked', async () => {
    const user = userEvent.setup()

    render(
      <VerbSession
        items={[makeItem()]}
        showHint={false}
        sessionUrl="/verbs/session?test"
      />
    )

    await user.click(screen.getByRole('button', { name: /Exit session/ }))

    expect(screen.getByText('¿Salir de la Sesión?')).toBeInTheDocument()
    expect(screen.getByText('Tu progreso de esta sesión no se guardará.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Seguir/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salir/ })).toBeInTheDocument()
  })

  it('shows Conjugación eyebrow label', () => {
    render(
      <VerbSession
        items={[makeItem()]}
        showHint={false}
        sessionUrl="/verbs/session?test"
      />
    )
    expect(screen.getByText('Conjugación')).toBeInTheDocument()
  })
})
