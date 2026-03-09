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
    expect(screen.getByRole('button', { name: /Check/ })).toBeInTheDocument()
  })

  it('disables Check button when input is empty', () => {
    render(
      <VerbSession
        items={[makeItem()]}
        showHint={false}
        sessionUrl="/verbs/session?test"
      />
    )
    expect(screen.getByRole('button', { name: /Check/ })).toBeDisabled()
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
    await user.click(screen.getByRole('button', { name: /Check/ }))

    expect(screen.getByText('Correct!')).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: /Check/ }))

    expect(screen.getByText(/Almost — check your accents/)).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: /Check/ }))

    expect(screen.getByText(/Not quite/)).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: /Check/ }))
    await user.click(screen.getByTestId('try-again-btn'))

    expect(screen.getByPlaceholderText(/Type the conjugated form/)).toHaveValue('')
    expect(screen.getByRole('button', { name: /Check/ })).toBeInTheDocument()
  })

  it('shows done screen after last item is answered incorrectly and Next is clicked', async () => {
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
    await user.click(screen.getByRole('button', { name: /Check/ }))

    // Click "Finish →" on the last item
    await user.click(screen.getByRole('button', { name: /Finish/ }))

    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Practice Again/ })).toBeInTheDocument()
  })

  it('shows progress counter', () => {
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
    await user.click(screen.getByRole('button', { name: /Check/ }))

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
})
