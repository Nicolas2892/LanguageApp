import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GrammarFocusChip } from '../GrammarFocusChip'

describe('GrammarFocusChip', () => {
  it('renders "Indicative" chip for indicative focus', () => {
    render(<GrammarFocusChip focus="indicative" />)
    const chip = screen.getByText('Indicative')
    expect(chip).toBeDefined()
    expect(chip.className).toContain('sky')
  })

  it('renders "Subjunctive" chip for subjunctive focus', () => {
    render(<GrammarFocusChip focus="subjunctive" />)
    const chip = screen.getByText('Subjunctive')
    expect(chip).toBeDefined()
    expect(chip.className).toContain('violet')
  })

  it('renders "Both moods" chip for both focus', () => {
    render(<GrammarFocusChip focus="both" />)
    const chip = screen.getByText('Both moods')
    expect(chip).toBeDefined()
    expect(chip.className).toContain('amber')
  })

  it('renders nothing when focus is null', () => {
    const { container } = render(<GrammarFocusChip focus={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when focus is undefined', () => {
    const { container } = render(<GrammarFocusChip focus={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for an unknown focus value', () => {
    const { container } = render(<GrammarFocusChip focus="unknown_value" />)
    expect(container.firstChild).toBeNull()
  })
})
