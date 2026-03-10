import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SessionConfig } from '../SessionConfig'

const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

const mockModules = [
  { id: 'mod-1', title: 'Connectors & Discourse', mastered: 3, total: 10 },
  { id: 'mod-2', title: 'Subjunctive Mastery', mastered: 1, total: 8 },
]

describe('SessionConfig', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockSearchParams = new URLSearchParams()
  })

  it('renders three mode buttons always', () => {
    render(<SessionConfig modules={mockModules} mistakeConceptCount={5} dueCount={3} />)
    expect(screen.getByRole('button', { name: /repaso diario/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /práctica abierta/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /revisar errores/i })).toBeTruthy()
  })

  it('Review mistakes button is hidden when mistakeConceptCount is 0', () => {
    render(<SessionConfig modules={mockModules} mistakeConceptCount={0} dueCount={3} />)
    expect(screen.getByRole('button', { name: /repaso diario/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /práctica abierta/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /revisar errores/i })).toBeNull()
  })

  it('Open Practice mode sets practice=true in URL (all modules)', () => {
    render(<SessionConfig modules={mockModules} mistakeConceptCount={0} dueCount={3} />)
    fireEvent.click(screen.getByRole('button', { name: /práctica abierta/i }))
    fireEvent.click(screen.getByRole('button', { name: /empezar sesión/i }))
    expect(mockPush).toHaveBeenCalledWith('/study?practice=true')
  })

  it('Open Practice mode with module appends module param', () => {
    render(<SessionConfig modules={mockModules} mistakeConceptCount={0} dueCount={3} />)
    fireEvent.click(screen.getByRole('button', { name: /práctica abierta/i }))
    fireEvent.click(screen.getByRole('button', { name: /connectors & discourse/i }))
    fireEvent.click(screen.getByRole('button', { name: /empezar sesión/i }))
    expect(mockPush).toHaveBeenCalledWith('/study?practice=true&module=mod-1')
  })

  it('pre-selects practice mode when ?mode=practice is in query params', () => {
    mockSearchParams = new URLSearchParams('mode=practice')
    render(<SessionConfig modules={mockModules} mistakeConceptCount={0} dueCount={3} />)
    // Open Practice should be visually active — verify clicking Start Session sends practice=true
    fireEvent.click(screen.getByRole('button', { name: /empezar sesión/i }))
    expect(mockPush).toHaveBeenCalledWith('/study?practice=true')
  })

  it('renders Todos module pill in practice mode', () => {
    render(<SessionConfig modules={mockModules} mistakeConceptCount={0} dueCount={3} />)
    fireEvent.click(screen.getByRole('button', { name: /práctica abierta/i }))
    expect(screen.getByRole('button', { name: 'Todos' })).toBeTruthy()
  })

  it('renders Todos module pill in SRS mode', () => {
    render(<SessionConfig modules={mockModules} mistakeConceptCount={0} dueCount={3} />)
    expect(screen.getByRole('button', { name: 'Todos' })).toBeTruthy()
  })

  it('shows due count in Repaso Diario subtitle', () => {
    render(<SessionConfig modules={mockModules} mistakeConceptCount={0} dueCount={7} />)
    expect(screen.getByText(/7 conceptos pendientes hoy/i)).toBeTruthy()
  })
})
