import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoogleButton } from '../GoogleButton'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({}),
    },
  }),
}))

describe('GoogleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Spanish text "Continuar con Google"', () => {
    render(<GoogleButton />)
    expect(screen.getByRole('button', { name: /Continuar con Google/i })).toBeInTheDocument()
  })

  it('shows "Redirigiendo…" when clicked', async () => {
    const user = userEvent.setup()
    render(<GoogleButton />)
    const btn = screen.getByRole('button', { name: /Continuar con Google/i })
    await user.click(btn)
    expect(screen.getByRole('button', { name: /Redirigiendo/i })).toBeInTheDocument()
  })

  it('has h-11 class for 44px touch target', () => {
    render(<GoogleButton />)
    const btn = screen.getByRole('button', { name: /Continuar con Google/i })
    expect(btn.className).toContain('h-11')
  })
})
