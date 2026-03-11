import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LevelChip } from '../LevelChip'

describe('LevelChip', () => {
  it('renders "B1" chip with D5 warm palette class', () => {
    render(<LevelChip level="B1" />)
    const chip = screen.getByText('B1')
    expect(chip).toBeDefined()
    expect(chip.className).toContain('#8C6A3F')
  })

  it('renders "B2" chip with D5 warm palette class', () => {
    render(<LevelChip level="B2" />)
    const chip = screen.getByText('B2')
    expect(chip).toBeDefined()
    expect(chip.className).toContain('#8C6A3F')
  })

  it('renders "C1" chip with D5 warm palette class', () => {
    render(<LevelChip level="C1" />)
    const chip = screen.getByText('C1')
    expect(chip).toBeDefined()
    expect(chip.className).toContain('#8C6A3F')
  })

  it('renders nothing when level is null', () => {
    const { container } = render(<LevelChip level={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when level is undefined', () => {
    const { container } = render(<LevelChip level={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for an unknown level value', () => {
    const { container } = render(<LevelChip level="A2" />)
    expect(container.firstChild).toBeNull()
  })
})
