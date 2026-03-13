import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '../login/page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({}),
      signInWithOAuth: vi.fn().mockResolvedValue({}),
    },
  }),
}))

vi.mock('@/lib/analytics', () => ({
  trackLogin: vi.fn(),
}))

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('labels have senda-field-label class', () => {
    render(<LoginPage />)
    const emailLabel = screen.getByText('Correo electrónico')
    const passwordLabel = screen.getByText('Contraseña')
    expect(emailLabel.className).toContain('senda-field-label')
    expect(passwordLabel.className).toContain('senda-field-label')
  })

  it('card has border-0 class', () => {
    const { container } = render(<LoginPage />)
    const card = container.querySelector('[class*="border-0"]')
    expect(card).toBeInTheDocument()
  })

  it('divider uses bg- not border-t', () => {
    const { container } = render(<LoginPage />)
    const dividerSpan = container.querySelector('.h-px')
    expect(dividerSpan).toBeInTheDocument()
    expect(dividerSpan?.className).toContain('bg-')
    expect(dividerSpan?.className).not.toContain('border-t')
  })

  it('CTA button has h-11 class', () => {
    render(<LoginPage />)
    const btn = screen.getByRole('button', { name: /iniciar sesión/i })
    expect(btn.className).toContain('h-11')
  })
})
