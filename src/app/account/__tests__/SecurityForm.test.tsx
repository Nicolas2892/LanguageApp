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

  it('renders "Change email" and "Change password" headings', () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    expect(screen.getByText('Change email')).toBeTruthy()
    expect(screen.getByText('Change password')).toBeTruthy()
  })

  it('email submit calls updateUser with entered value', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null })
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('New email address'), 'new@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Update email' }))
    expect(mockUpdateUser).toHaveBeenCalledWith({ email: 'new@example.com' })
  })

  it('email success shows confirmation message', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null })
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('New email address'), 'new@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Update email' }))
    await waitFor(() => {
      expect(screen.getByText(/Confirmation email sent/)).toBeTruthy()
    })
  })

  it('email error shows error message', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: new Error('Email already in use') })
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('New email address'), 'taken@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Update email' }))
    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeTruthy()
    })
  })

  it('OAuth user sees notice and no password form', () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={true} />)
    expect(screen.getByText(/Password changes are not available for Google sign-in/)).toBeTruthy()
    expect(screen.queryByLabelText('Current password')).toBeNull()
  })

  it('non-OAuth user renders three password fields', () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    expect(screen.getByLabelText('Current password')).toBeTruthy()
    expect(screen.getByLabelText('New password')).toBeTruthy()
    expect(screen.getByLabelText('Confirm new password')).toBeTruthy()
  })

  it('client validation: new password < 6 chars shows error, no API call', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Current password'), 'oldpassword')
    await userEvent.type(screen.getByLabelText('New password'), 'abc')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
    expect(screen.getByText('New password must be at least 6 characters.')).toBeTruthy()
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('client validation: passwords don\'t match shows error, no API call', async () => {
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Current password'), 'oldpassword')
    await userEvent.type(screen.getByLabelText('New password'), 'newpassword123')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'differentpassword')
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
    expect(screen.getByText('Passwords do not match.')).toBeTruthy()
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('password submit calls signInWithPassword then updateUser', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })
    mockUpdateUser.mockResolvedValueOnce({ error: null })
    render(<SecurityForm userEmail="user@example.com" isOAuthUser={false} />)
    await userEvent.type(screen.getByLabelText('Current password'), 'oldpassword')
    await userEvent.type(screen.getByLabelText('New password'), 'newpassword123')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'newpassword123')
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
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
    await userEvent.type(screen.getByLabelText('Current password'), 'wrongpassword')
    await userEvent.type(screen.getByLabelText('New password'), 'newpassword123')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'newpassword123')
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect.')).toBeTruthy()
    })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })
})
