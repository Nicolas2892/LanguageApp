import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DangerZone } from '../DangerZone'

const mockSignOut = vi.fn()
const mockPush = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('DangerZone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders "Sign out" button', () => {
    render(<DangerZone />)
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy()
  })

  it('sign out calls supabase.auth.signOut() and redirects to /auth/login', async () => {
    mockSignOut.mockResolvedValueOnce({})
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(mockSignOut).toHaveBeenCalled()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/login'))
  })

  it('"Delete account" button visible in default state', () => {
    render(<DangerZone />)
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeTruthy()
  })

  it('delete button click shows confirmation UI', async () => {
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }))
    expect(screen.getByText(/This will permanently delete your account/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Yes, delete my account' })).toBeTruthy()
  })

  it('cancel hides confirmation and shows original button', async () => {
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeTruthy()
    expect(screen.queryByText(/This will permanently delete your account/)).toBeNull()
  })

  it('confirm delete calls POST /api/account/delete and redirects to /auth/login', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }))
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete my account' }))
    expect(global.fetch).toHaveBeenCalledWith('/api/account/delete', { method: 'POST' })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/login'))
  })

  it('delete API error shows error message', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response)
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }))
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete my account' }))
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeTruthy()
    })
  })

  it('deleting state: confirm button shows "Deleting…" and is disabled', async () => {
    let resolveFetch!: () => void
    vi.mocked(global.fetch).mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = () => resolve({ ok: true, json: async () => ({ ok: true }) } as Response)
      })
    )
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }))
    const clickPromise = userEvent.click(screen.getByRole('button', { name: 'Yes, delete my account' }))
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Deleting…' })
      expect(btn).toBeTruthy()
      expect((btn as HTMLButtonElement).disabled).toBe(true)
    })
    resolveFetch()
    await clickPromise
  })
})
