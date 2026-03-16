import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppHeader } from '../AppHeader'

let mockPathname = '/dashboard'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

const defaultProps = { userInitials: 'NI', streak: 5, streakFreezeRemaining: 1 }

describe('AppHeader', () => {
  it('shows tutor icon on /dashboard', () => {
    mockPathname = '/dashboard'
    render(<AppHeader {...defaultProps} />)
    expect(screen.getByLabelText('Tutor')).toBeTruthy()
  })

  it('shows tutor icon on /curriculum', () => {
    mockPathname = '/curriculum'
    render(<AppHeader {...defaultProps} />)
    expect(screen.getByLabelText('Tutor')).toBeTruthy()
  })

  it('shows tutor icon on /verbs', () => {
    mockPathname = '/verbs'
    render(<AppHeader {...defaultProps} />)
    expect(screen.getByLabelText('Tutor')).toBeTruthy()
  })

  it('shows tutor icon on /verbs/hablar (sub-route)', () => {
    mockPathname = '/verbs/hablar'
    render(<AppHeader {...defaultProps} />)
    expect(screen.getByLabelText('Tutor')).toBeTruthy()
  })

  it('shows tutor icon on /curriculum (tree page)', () => {
    mockPathname = '/curriculum'
    render(<AppHeader {...defaultProps} />)
    expect(screen.getByLabelText('Tutor')).toBeTruthy()
  })

  it('does not show tutor icon on /progress', () => {
    mockPathname = '/progress'
    render(<AppHeader {...defaultProps} />)
    expect(screen.queryByLabelText('Tutor')).toBeNull()
  })

  it('is hidden on /study routes', () => {
    mockPathname = '/study'
    const { container } = render(<AppHeader {...defaultProps} />)
    expect(container.innerHTML).toBe('')
  })

  it('tutor icon links to /tutor', () => {
    mockPathname = '/dashboard'
    render(<AppHeader {...defaultProps} />)
    const link = screen.getByLabelText('Tutor')
    expect(link.getAttribute('href')).toBe('/tutor')
  })

  it('tutor icon has 44px touch target', () => {
    mockPathname = '/dashboard'
    render(<AppHeader {...defaultProps} />)
    const link = screen.getByLabelText('Tutor')
    expect(link.className).toContain('min-w-[44px]')
    expect(link.className).toContain('min-h-[44px]')
  })

  it('shows report badge when unreadReportCount > 0', () => {
    mockPathname = '/dashboard'
    render(<AppHeader {...defaultProps} unreadReportCount={3} />)
    const link = screen.getByLabelText('Informes offline')
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe('/offline/reports')
  })

  it('does not show report badge when unreadReportCount is 0', () => {
    mockPathname = '/dashboard'
    render(<AppHeader {...defaultProps} unreadReportCount={0} />)
    expect(screen.queryByLabelText('Informes offline')).toBeNull()
  })

  it('does not show report badge by default', () => {
    mockPathname = '/dashboard'
    render(<AppHeader {...defaultProps} />)
    expect(screen.queryByLabelText('Informes offline')).toBeNull()
  })
})
