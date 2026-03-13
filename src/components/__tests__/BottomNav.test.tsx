import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '../BottomNav'

let mockPathname = '/dashboard'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

describe('BottomNav', () => {
  it('renders exactly 5 tabs', () => {
    mockPathname = '/dashboard'
    render(<BottomNav />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
  })

  it('does not include a Tutor tab', () => {
    mockPathname = '/dashboard'
    render(<BottomNav />)
    expect(screen.queryByText('Tutor')).toBeNull()
  })

  it('includes expected tab labels', () => {
    mockPathname = '/dashboard'
    render(<BottomNav />)
    expect(screen.getByText('Inicio')).toBeTruthy()
    expect(screen.getByText('Estudio')).toBeTruthy()
    expect(screen.getByText('Currículo')).toBeTruthy()
    expect(screen.getByText('Verbos')).toBeTruthy()
    expect(screen.getByText('Progreso')).toBeTruthy()
  })

  it('uses 10px font size for labels (Audit-D2 fix)', () => {
    mockPathname = '/dashboard'
    render(<BottomNav />)
    const label = screen.getByText('Inicio')
    expect(label.className).toContain('text-[0.625rem]')
  })

  it('is hidden on auth routes', () => {
    mockPathname = '/auth/login'
    const { container } = render(<BottomNav />)
    expect(container.innerHTML).toBe('')
  })
})
