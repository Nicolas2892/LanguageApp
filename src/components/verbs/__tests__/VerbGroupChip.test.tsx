import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerbGroupChip } from '../VerbGroupChip'

describe('VerbGroupChip', () => {
  it('renders -ar chip for "ar" group', () => {
    render(<VerbGroupChip group="ar" />)
    expect(screen.getByText('-ar')).toBeInTheDocument()
  })

  it('renders -er chip for "er" group', () => {
    render(<VerbGroupChip group="er" />)
    expect(screen.getByText('-er')).toBeInTheDocument()
  })

  it('renders -ir chip for "ir" group', () => {
    render(<VerbGroupChip group="ir" />)
    expect(screen.getByText('-ir')).toBeInTheDocument()
  })

  it('renders irreg. chip for "irregular" group', () => {
    render(<VerbGroupChip group="irregular" />)
    expect(screen.getByText('irreg.')).toBeInTheDocument()
  })

  it('returns null for null/undefined group', () => {
    const { container } = render(<VerbGroupChip group={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null for unknown group', () => {
    const { container } = render(<VerbGroupChip group="unknown" />)
    expect(container.innerHTML).toBe('')
  })

  it('applies pill styling with border', () => {
    render(<VerbGroupChip group="ar" />)
    const chip = screen.getByText('-ar')
    expect(chip.className).toContain('border')
    expect(chip.className).toContain('text-[10px]')
    expect(chip.className).toContain('font-semibold')
  })
})
