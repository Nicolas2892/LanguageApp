import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SecurityForm } from '../SecurityForm'

const mockUpdateUser = vi.fn()
const mockSignInWithPassword = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}))

describe('SecurityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Cambiar correo" and "Cambiar contraseña" headings', () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    expect(screen.getByText('Cambiar correo')).toBeTruthy()
    expect(screen.getByText('Cambiar contraseña')).toBeTruthy()
  })

  it('email submit calls updateUser with entered value', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null })
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nuevo correo'), 'new@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar correo' }))
    expect(mockUpdateUser).toHaveBeenCalledWith({ email: 'new@example.com' })
  })

  it('email success shows confirmation message', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null })
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nuevo correo'), 'new@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar correo' }))
    await waitFor(() => {
      expect(screen.getByText(/Correo de confirmación enviado/)).toBeTruthy()
    })
  })

  it('email error shows error message', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: new Error('Email already in use') })
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nuevo correo'), 'taken@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar correo' }))
    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeTruthy()
    })
  })

  it('OAuth user sees notice and no password form', () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={true} />)
    expect(screen.getByText(/Los cambios de contraseña no están disponibles/)).toBeTruthy()
    expect(screen.queryByLabelText('Contraseña actual')).toBeNull()
  })

  it('non-OAuth user renders three password fields', () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    expect(screen.getByLabelText('Contraseña actual')).toBeTruthy()
    expect(screen.getByLabelText('Nueva contraseña')).toBeTruthy()
    expect(screen.getByLabelText('Confirmar contraseña')).toBeTruthy()
  })

  it('client validation: new password < 6 chars shows error, no API call', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'oldpassword')
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'abc')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))
    expect(screen.getByText('La nueva contraseña debe tener al menos 6 caracteres.')).toBeTruthy()
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('client validation: passwords don\'t match shows error, no API call', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'oldpassword')
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'newpassword123')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'differentpassword')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy()
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('password submit calls signInWithPassword then updateUser', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })
    mockUpdateUser.mockResolvedValueOnce({ error: null })
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'oldpassword')
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'newpassword123')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'newpassword123')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'oldpassword',
    })
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
    })
  })

  it('wrong current password shows error, no updateUser called', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: new Error('Invalid login credentials') })
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'wrongpassword')
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'newpassword123')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'newpassword123')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))
    await waitFor(() => {
      expect(screen.getByText('La contraseña actual es incorrecta.')).toBeTruthy()
    })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  // --- Email format validation ---

  it('invalid email format shows error and does not call updateUser', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nuevo correo'), 'notanemail')
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar correo' }))
    expect(screen.getByText('Introduce un correo válido.')).toBeTruthy()
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  // --- Show/hide password toggles ---

  it('show/hide toggle on current password changes input type', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    const input = screen.getByLabelText('Contraseña actual') as HTMLInputElement
    expect(input.type).toBe('password')
    const toggleBtns = screen.getAllByRole('button', { name: 'Mostrar contraseña' })
    await userEvent.click(toggleBtns[0])
    expect(input.type).toBe('text')
  })

  it('show/hide toggle on new password changes input type', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    const input = screen.getByLabelText('Nueva contraseña') as HTMLInputElement
    expect(input.type).toBe('password')
    const toggleBtns = screen.getAllByRole('button', { name: 'Mostrar contraseña' })
    await userEvent.click(toggleBtns[1])
    expect(input.type).toBe('text')
  })

  // --- Touch target accessibility ---

  it('password toggle buttons have WCAG 44px minimum touch targets', () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    const toggleBtns = screen.getAllByRole('button', { name: 'Mostrar contraseña' })
    expect(toggleBtns).toHaveLength(3)
    for (const btn of toggleBtns) {
      expect(btn.className).toContain('min-w-[44px]')
      expect(btn.className).toContain('min-h-[44px]')
    }
  })

  // --- Password strength indicator ---

  it('password strength hidden when new password field is empty', () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    expect(screen.queryByText('Muy corta')).toBeNull()
    expect(screen.queryByText('Aceptable')).toBeNull()
    expect(screen.queryByText('Segura')).toBeNull()
  })

  it('password strength shows "Muy corta" for fewer than 6 chars', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'abc')
    expect(screen.getByText('Muy corta')).toBeTruthy()
  })

  it('password strength shows "Aceptable" for 6–11 chars', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'abcdef')
    expect(screen.getByText('Aceptable')).toBeTruthy()
  })

  it('password strength shows "Segura" for 12+ chars', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'abcdefghijkl')
    expect(screen.getByText('Segura')).toBeTruthy()
  })

  // --- Real-time confirm mismatch (Audit-D6) ---

  it('shows mismatch warning on confirm blur when passwords differ', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'newpassword123')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'different')
    // Tab away to trigger blur
    await userEvent.tab()
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy()
  })

  it('does not show mismatch warning when passwords match on blur', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'newpassword123')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'newpassword123')
    await userEvent.tab()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('clears mismatch warning when user resumes typing', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'newpassword123')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'diff')
    await userEvent.tab()
    expect(screen.getByRole('alert')).toBeTruthy()
    // Resume typing in confirm field
    await userEvent.click(screen.getByLabelText('Confirmar contraseña'))
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'x')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
