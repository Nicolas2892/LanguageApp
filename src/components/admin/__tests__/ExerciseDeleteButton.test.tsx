import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseDeleteButton } from '../ExerciseDeleteButton'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

describe('ExerciseDeleteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders delete button', () => {
    render(<ExerciseDeleteButton exerciseId="ex-1" />)
    expect(screen.getByTestId('delete-exercise')).toBeInTheDocument()
  })

  it('shows confirmation dialog on click', async () => {
    const user = userEvent.setup()
    render(<ExerciseDeleteButton exerciseId="ex-1" />)

    await user.click(screen.getByTestId('delete-exercise'))
    expect(screen.getByText('¿Eliminar?')).toBeInTheDocument()
    expect(screen.getByTestId('confirm-delete')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('cancels deletion when Cancelar is clicked', async () => {
    const user = userEvent.setup()
    render(<ExerciseDeleteButton exerciseId="ex-1" />)

    await user.click(screen.getByTestId('delete-exercise'))
    await user.click(screen.getByText('Cancelar'))

    // Back to initial state
    expect(screen.getByTestId('delete-exercise')).toBeInTheDocument()
    expect(screen.queryByText('¿Eliminar?')).not.toBeInTheDocument()
  })

  it('calls DELETE API and redirects on success', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    render(<ExerciseDeleteButton exerciseId="ex-1" />)

    await user.click(screen.getByTestId('delete-exercise'))
    await user.click(screen.getByTestId('confirm-delete'))

    expect(global.fetch).toHaveBeenCalledWith('/api/admin/exercises/ex-1', { method: 'DELETE' })
    expect(mockPush).toHaveBeenCalledWith('/admin/exercises')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('shows error on API failure', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Server error' }), { status: 500 }),
    )

    render(<ExerciseDeleteButton exerciseId="ex-1" />)

    await user.click(screen.getByTestId('delete-exercise'))
    await user.click(screen.getByTestId('confirm-delete'))

    expect(await screen.findByText('Server error')).toBeInTheDocument()
  })

  it('uses custom redirectTo path', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    render(<ExerciseDeleteButton exerciseId="ex-1" redirectTo="/admin/pool" />)

    await user.click(screen.getByTestId('delete-exercise'))
    await user.click(screen.getByTestId('confirm-delete'))

    expect(mockPush).toHaveBeenCalledWith('/admin/pool')
  })
})
