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

  it('renders "Sesión" heading and "Cerrar sesión" button', () => {
    render(<DangerZone />)
    expect(screen.getByText('Sesión')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cerrar sesión/ })).toBeTruthy()
  })

  it('sign out calls supabase.auth.signOut() and redirects to /auth/login', async () => {
    mockSignOut.mockResolvedValueOnce({})
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: /Cerrar sesión/ }))
    expect(mockSignOut).toHaveBeenCalled()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/login'))
  })

  it('"Eliminar cuenta" button visible in default state under "Zona de peligro" heading', () => {
    render(<DangerZone />)
    expect(screen.getByText('Zona de peligro')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Eliminar cuenta/ })).toBeTruthy()
  })

  it('delete button click shows confirmation UI', async () => {
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: /Eliminar cuenta/ }))
    expect(screen.getByText(/Esto eliminará permanentemente tu cuenta/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' })).toBeTruthy()
  })

  it('cancel hides confirmation and shows original button', async () => {
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: /Eliminar cuenta/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('button', { name: /Eliminar cuenta/ })).toBeTruthy()
    expect(screen.queryByText(/Esto eliminará permanentemente tu cuenta/)).toBeNull()
  })

  it('confirm delete calls POST /api/account/delete and redirects to /auth/login', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: /Eliminar cuenta/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }))
    expect(global.fetch).toHaveBeenCalledWith('/api/account/delete', { method: 'POST' })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/login'))
  })

  it('delete API error shows error message', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response)
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: /Eliminar cuenta/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }))
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeTruthy()
    })
  })

  it('deleting state: confirm button shows "Eliminando…" and is disabled', async () => {
    let resolveFetch!: () => void
    vi.mocked(global.fetch).mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = () => resolve({ ok: true, json: async () => ({ ok: true }) } as Response)
      })
    )
    render(<DangerZone />)
    await userEvent.click(screen.getByRole('button', { name: /Eliminar cuenta/ }))
    const clickPromise = userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }))
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Eliminando…' })
      expect(btn).toBeTruthy()
      expect((btn as HTMLButtonElement).disabled).toBe(true)
    })
    resolveFetch()
    await clickPromise
  })
})
