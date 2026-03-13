import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignupPage from '../signup/page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: vi.fn().mockResolvedValue({}),
      signInWithOAuth: vi.fn().mockResolvedValue({}),
    },
  }),
}))

vi.mock('@/lib/analytics', () => ({
  trackSignup: vi.fn(),
}))

describe('SignupPage', () => {
  it('renders all 4 form fields', () => {
    render(<SignupPage />)
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument()
  })

  it('labels have senda-field-label class', () => {
    render(<SignupPage />)
    const labels = ['Nombre', 'Correo electrónico', 'Contraseña', 'Confirmar contraseña']
    labels.forEach((text) => {
      const label = screen.getByText(text)
      expect(label.className).toContain('senda-field-label')
    })
  })

  it('card has border-0 class', () => {
    const { container } = render(<SignupPage />)
    const card = container.querySelector('[class*="border-0"]')
    expect(card).toBeInTheDocument()
  })

  it('divider uses bg- not border-t', () => {
    const { container } = render(<SignupPage />)
    const dividerSpan = container.querySelector('.h-px')
    expect(dividerSpan).toBeInTheDocument()
    expect(dividerSpan?.className).toContain('bg-')
    expect(dividerSpan?.className).not.toContain('border-t')
  })

  it('CTA button has h-11 class', () => {
    render(<SignupPage />)
    const btn = screen.getByRole('button', { name: /crear cuenta/i })
    expect(btn.className).toContain('h-11')
  })
})
