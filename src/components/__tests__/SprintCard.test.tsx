import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SprintCard } from '../SprintCard'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockModules = [
  { id: 'mod-1', title: 'Connectors & Discourse' },
  { id: 'mod-2', title: 'Subjunctive Mastery' },
]

describe('SprintCard', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders collapsed by default with quick-start and customise buttons', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    expect(screen.getByRole('button', { name: /sprint 10 min/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /customise/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Start Sprint →' })).toBeNull()
  })

  it('shows dueCount in collapsed heading when dueCount > 0', () => {
    render(<SprintCard dueCount={8} modules={mockModules} />)
    expect(screen.getByText(/8 concepts due/i)).toBeTruthy()
  })

  it('shows fallback text when dueCount is 0', () => {
    render(<SprintCard dueCount={0} modules={mockModules} />)
    expect(screen.getByText(/focus in a fixed time slot/i)).toBeTruthy()
  })

  it('quick-start button navigates directly with default 10 min', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /sprint 10 min/i }))
    expect(mockPush).toHaveBeenCalledWith('/study?mode=sprint&limitType=time&limit=10')
  })

  it('expands config panel when Customise button is clicked', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    expect(screen.getByRole('button', { name: 'Start Sprint →' })).toBeTruthy()
  })

  it('X button collapses the expanded panel', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    expect(screen.getByRole('button', { name: 'Start Sprint →' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /close sprint config/i }))
    expect(screen.queryByRole('button', { name: 'Start Sprint →' })).toBeNull()
  })

  it('shows "All" module chip selected by default (orange-500)', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    const allBtn = screen.getByRole('button', { name: 'All' })
    expect(allBtn.className).toContain('bg-orange-500')
  })

  it('renders module chips for each module', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    expect(screen.getByRole('button', { name: 'Connectors & Discourse' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Subjunctive Mastery' })).toBeTruthy()
  })

  it('selecting a module chip activates it with orange-500', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Connectors & Discourse' }))
    const modBtn = screen.getByRole('button', { name: 'Connectors & Discourse' })
    expect(modBtn.className).toContain('bg-orange-500')
    const allBtn = screen.getByRole('button', { name: 'All' })
    expect(allBtn.className).not.toContain('bg-orange-500')
  })

  it('shows 3 time options by default (5 min, 10 min, 15 min)', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    expect(screen.getByRole('button', { name: '5 min' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '10 min' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '15 min' })).toBeTruthy()
  })

  it('10 min chip is selected by default (orange-500)', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    const tenMin = screen.getByRole('button', { name: '10 min' })
    expect(tenMin.className).toContain('bg-orange-500')
  })

  it('switching to Exercises shows 4 count options (5, 10, 15, 20)', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    fireEvent.click(screen.getByRole('button', { name: /exercises/i }))
    // Time options gone
    expect(screen.queryByRole('button', { name: '5 min' })).toBeNull()
    // Count options present
    expect(screen.getByRole('button', { name: '5' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '10' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '15' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '20' })).toBeTruthy()
  })

  it('switching limitType resets limit to 10', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    // Select 5 min
    fireEvent.click(screen.getByRole('button', { name: '5 min' }))
    // Switch to count
    fireEvent.click(screen.getByRole('button', { name: /exercises/i }))
    // 10 should be selected (reset)
    const ten = screen.getByRole('button', { name: '10' })
    expect(ten.className).toContain('bg-orange-500')
  })

  it('Start Sprint navigates with correct URL for time mode (no module)', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Start Sprint →' }))
    expect(mockPush).toHaveBeenCalledWith(
      '/study?mode=sprint&limitType=time&limit=10'
    )
  })

  it('Start Sprint navigates with module param when module selected', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Connectors & Discourse' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start Sprint →' }))
    expect(mockPush).toHaveBeenCalledWith(
      '/study?mode=sprint&limitType=time&limit=10&module=mod-1'
    )
  })

  it('Start Sprint includes limitType=count when count mode selected', () => {
    render(<SprintCard dueCount={5} modules={mockModules} />)
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    fireEvent.click(screen.getByRole('button', { name: /exercises/i }))
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start Sprint →' }))
    expect(mockPush).toHaveBeenCalledWith(
      '/study?mode=sprint&limitType=count&limit=15'
    )
  })

  it('module chip shows due count badge when dueCountByModule provided', () => {
    render(
      <SprintCard
        dueCount={5}
        modules={mockModules}
        dueCountByModule={{ 'mod-1': 3, 'mod-2': 2 }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /customise/i }))
    expect(screen.getByRole('button', { name: 'Connectors & Discourse · 3' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Subjunctive Mastery · 2' })).toBeTruthy()
  })
})
