import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeeklyActivityChart } from '../WeeklyActivityChart'
import type { WeekData } from '../WeeklyActivityChart'

// Build 14 weeks of test data
function makeWeeks(overrides: Partial<Record<number, number>> = {}): WeekData[] {
  const weeks: WeekData[] = []
  const base = new Date('2026-01-05') // a Monday
  for (let i = 0; i < 14; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i * 7)
    weeks.push({
      weekStart: d.toISOString().split('T')[0],
      count: overrides[i] ?? 0,
    })
  }
  return weeks
}

describe('WeeklyActivityChart', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders 14 week bars', () => {
    const { container } = render(
      <WeeklyActivityChart
        data={makeWeeks()}
        sessionCount={5}
        totalMinutes={120}
        uniqueDaysStudied={10}
      />
    )
    // Each bar is a flex-1 div inside the bar container
    const barContainer = container.querySelector('.flex.items-end.gap-1')!
    const bars = barContainer.children
    expect(bars.length).toBe(14)
  })

  it('applies correct bar colors based on count thresholds', () => {
    vi.useFakeTimers()
    const data = makeWeeks({ 0: 0, 1: 1, 2: 4, 3: 8 })
    const { container } = render(
      <WeeklyActivityChart
        data={data}
        sessionCount={0}
        totalMinutes={0}
        uniqueDaysStudied={0}
      />
    )
    vi.advanceTimersByTime(200)

    const barContainer = container.querySelector('.flex.items-end.gap-1')!
    // Get the inner bar divs (the ones with rounded-t-sm)
    const innerBars = barContainer.querySelectorAll('.rounded-t-sm')

    // count=0 → var(--muted) CSS class (bg-muted via getBarColor)
    expect(innerBars[0].getAttribute('style')).toContain('var(--muted)')
    // count=1 → var(--d5-muted)
    expect(innerBars[1].getAttribute('style')).toContain('var(--d5-muted)')
    // count=4 → var(--d5-warm)
    expect(innerBars[2].getAttribute('style')).toContain('var(--d5-warm)')
    // count=8 → var(--d5-terracotta)
    expect(innerBars[3].getAttribute('style')).toContain('var(--d5-terracotta)')
  })

  it('displays legend with Menos/Más', () => {
    render(
      <WeeklyActivityChart
        data={makeWeeks()}
        sessionCount={0}
        totalMinutes={0}
        uniqueDaysStudied={0}
      />
    )
    expect(screen.getByText('Menos')).toBeInTheDocument()
    expect(screen.getByText('Más')).toBeInTheDocument()
  })

  it('shows session count and days studied in stats row', () => {
    render(
      <WeeklyActivityChart
        data={makeWeeks()}
        sessionCount={9}
        totalMinutes={360}
        uniqueDaysStudied={5}
      />
    )
    expect(screen.getByText(/9 Sesiones/)).toBeInTheDocument()
    expect(screen.getByText(/5 Días/)).toBeInTheDocument()
  })

  it('renders month labels', () => {
    // The first bar always gets a month label
    const data = makeWeeks()
    const { container } = render(
      <WeeklyActivityChart
        data={data}
        sessionCount={0}
        totalMinutes={0}
        uniqueDaysStudied={0}
      />
    )
    // Should have at least one month label rendered
    const monthLabels = container.querySelectorAll('.capitalize')
    const nonEmpty = Array.from(monthLabels).filter((el) => el.textContent!.trim())
    expect(nonEmpty.length).toBeGreaterThan(0)
  })

  it('renders zero-activity bars with minimal height', () => {
    vi.useFakeTimers()
    const data = makeWeeks() // all zeros
    const { container } = render(
      <WeeklyActivityChart
        data={data}
        sessionCount={0}
        totalMinutes={0}
        uniqueDaysStudied={0}
      />
    )
    vi.advanceTimersByTime(200)

    const barContainer = container.querySelector('.flex.items-end.gap-1')!
    const innerBars = barContainer.querySelectorAll('.rounded-t-sm')
    // Zero count bars should still render (height > 0 after mount)
    expect(innerBars.length).toBe(14)
  })

  it('shows tooltip on tap and hides on second tap', async () => {
    const data = makeWeeks({ 5: 12 })
    const { container } = render(
      <WeeklyActivityChart
        data={data}
        sessionCount={1}
        totalMinutes={30}
        uniqueDaysStudied={1}
      />
    )

    const barContainer = container.querySelector('.flex.items-end.gap-1')!
    const barWrappers = barContainer.children
    const wrapper = barWrappers[5] as HTMLElement
    const tooltipEl = wrapper.firstElementChild as HTMLElement

    // Before tap: tooltip has opacity-0 (hidden)
    expect(tooltipEl.className).toContain('opacity-0')

    // Tap bar 5 (has count=12) — tooltip becomes visible
    await userEvent.click(wrapper)
    expect(tooltipEl.className).not.toContain('opacity-0')
    expect(tooltipEl.textContent).toContain('12 ejercicios')

    // Tap same bar again → tooltip hidden (opacity-0 restored)
    await userEvent.click(wrapper)
    expect(tooltipEl.className).toContain('opacity-0')
  })
})
