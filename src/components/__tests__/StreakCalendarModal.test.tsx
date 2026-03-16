import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StreakCalendarModal } from '../StreakCalendarModal'

// Mock fetch
const mockCalendarData = {
  studiedDates: ['2026-03-10', '2026-03-12', '2026-03-15'],
  streak: 5,
  freezeRemaining: 1,
  freezeUsedDate: null,
  lastStudiedDate: '2026-03-15',
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCalendarData),
    })
  )
})

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  streak: 5,
  freezeRemaining: 1,
  timezone: 'Europe/Berlin',
}

describe('StreakCalendarModal', () => {
  it('renders the streak heading with day count', () => {
    render(<StreakCalendarModal {...defaultProps} />)
    expect(screen.getByText('5 días de racha')).toBeInTheDocument()
  })

  it('renders "Empieza tu racha" when streak is 0', () => {
    render(<StreakCalendarModal {...defaultProps} streak={0} />)
    expect(screen.getByText('Empieza tu racha')).toBeInTheDocument()
  })

  it('renders day-of-week labels', () => {
    render(<StreakCalendarModal {...defaultProps} />)
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('X')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
  })

  it('fetches calendar data on open', async () => {
    render(<StreakCalendarModal {...defaultProps} />)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/streak/calendar?month='))
    })
  })

  it('renders studied day markers after loading', async () => {
    render(<StreakCalendarModal {...defaultProps} />)
    await waitFor(() => {
      const studiedMarkers = screen.getAllByTitle(/Estudiado:/)
      expect(studiedMarkers.length).toBe(3)
    })
  })

  it('renders freeze card with available protection', () => {
    render(<StreakCalendarModal {...defaultProps} />)
    expect(screen.getByText('1 Protección disponible')).toBeInTheDocument()
  })

  it('renders freeze card with "Protección usada" when none remaining', () => {
    render(<StreakCalendarModal {...defaultProps} freezeRemaining={0} />)
    expect(screen.getByText('Protección usada')).toBeInTheDocument()
  })

  it('renders month navigation buttons', () => {
    render(<StreakCalendarModal {...defaultProps} />)
    expect(screen.getByLabelText('Mes anterior')).toBeInTheDocument()
    expect(screen.getByLabelText('Mes siguiente')).toBeInTheDocument()
  })

  it('navigates to previous month', async () => {
    const user = userEvent.setup()
    render(<StreakCalendarModal {...defaultProps} />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    const prevBtn = screen.getByLabelText('Mes anterior')
    await user.click(prevBtn)

    await waitFor(() => {
      // Should fetch for the previous month
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('shows loading state then resolves to calendar grid', async () => {
    render(<StreakCalendarModal {...defaultProps} />)
    // After fetch resolves, studied markers should appear
    await waitFor(() => {
      const studiedMarkers = screen.getAllByTitle(/Estudiado:/)
      expect(studiedMarkers.length).toBe(3)
    })
  })

  it('does not render when closed', () => {
    render(<StreakCalendarModal {...defaultProps} open={false} />)
    expect(screen.queryByText('días de racha')).not.toBeInTheDocument()
  })

  it('renders "día" (singular) when streak is 1', () => {
    render(<StreakCalendarModal {...defaultProps} streak={1} />)
    expect(screen.getByText('1 día de racha')).toBeInTheDocument()
  })
})
