import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeeklySnapshot } from '../WeeklySnapshot'

const defaults = {
  exercises: 20,
  accuracy: 75,
  minutes: 30,
  exerciseDelta: 5,
  accuracyDelta: 3,
  minutesDelta: 10,
}

describe('WeeklySnapshot', () => {
  it('renders three stat columns', () => {
    render(<WeeklySnapshot {...defaults} />)
    expect(screen.getByText('exercises')).toBeTruthy()
    expect(screen.getByText('accuracy')).toBeTruthy()
    expect(screen.getByText('minutes')).toBeTruthy()
  })

  it('shows ▲ indicator when exerciseDelta > 0', () => {
    render(<WeeklySnapshot {...defaults} exerciseDelta={5} />)
    expect(screen.getByText('▲+5')).toBeTruthy()
  })

  it('shows ▼ indicator when exerciseDelta < 0', () => {
    render(<WeeklySnapshot {...defaults} exerciseDelta={-3} />)
    expect(screen.getByText('▼-3')).toBeTruthy()
  })

  it('shows — when delta is null', () => {
    render(<WeeklySnapshot {...defaults} exerciseDelta={null} accuracyDelta={null} minutesDelta={null} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(3)
  })

  it('shows —% when accuracy is null', () => {
    render(<WeeklySnapshot {...defaults} accuracy={null} />)
    expect(screen.getByText('—%')).toBeTruthy()
  })

  it('renders correctly with all zeros', () => {
    render(
      <WeeklySnapshot
        exercises={0}
        accuracy={0}
        minutes={0}
        exerciseDelta={0}
        accuracyDelta={0}
        minutesDelta={0}
      />,
    )
    expect(screen.getByText('0%')).toBeTruthy()
    // Zero delta shows "="
    const equals = screen.getAllByText('=')
    expect(equals.length).toBe(3)
  })
})
