import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerbFavoriteButton } from '../VerbFavoriteButton'

describe('VerbFavoriteButton', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('renders unfavorited heart', () => {
    render(<VerbFavoriteButton verbId="verb-1" initialFavorited={false} />)
    expect(screen.getByRole('button', { name: /Add to favorites/ })).toBeInTheDocument()
  })

  it('renders favorited heart', () => {
    render(<VerbFavoriteButton verbId="verb-1" initialFavorited={true} />)
    expect(screen.getByRole('button', { name: /Remove from favorites/ })).toBeInTheDocument()
  })

  it('optimistically toggles to favorited on click', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ favorited: true }),
    } as Response)

    const user = userEvent.setup()
    render(<VerbFavoriteButton verbId="verb-1" initialFavorited={false} />)

    await user.click(screen.getByRole('button', { name: /Add to favorites/ }))
    expect(screen.getByRole('button', { name: /Remove from favorites/ })).toBeInTheDocument()
  })

  it('reverts on API failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    const user = userEvent.setup()
    render(<VerbFavoriteButton verbId="verb-1" initialFavorited={false} />)

    await user.click(screen.getByRole('button', { name: /Add to favorites/ }))
    // After revert, should be back to unfavorited
    expect(screen.getByRole('button', { name: /Add to favorites/ })).toBeInTheDocument()
  })

  it('calls correct endpoint with verb_id', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ favorited: false }),
    } as Response)

    const user = userEvent.setup()
    render(<VerbFavoriteButton verbId="abc-123" initialFavorited={true} />)

    await user.click(screen.getByRole('button', { name: /Remove from favorites/ }))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/verbs/favorite',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ verb_id: 'abc-123' }),
      }),
    )
  })
})
