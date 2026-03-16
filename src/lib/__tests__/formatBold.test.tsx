import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { formatBold } from '../formatBold'

describe('formatBold', () => {
  it('returns plain text unchanged', () => {
    const result = formatBold('no bold here')
    expect(result).toBe('no bold here')
  })

  it('returns empty string unchanged', () => {
    const result = formatBold('')
    expect(result).toBe('')
  })

  it('renders a single bold segment as <strong>', () => {
    const result = formatBold('Use **aunque + subjuntivo** for concessions.')
    const { container } = render(<>{result}</>)
    const strong = container.querySelector('strong')
    expect(strong).not.toBeNull()
    expect(strong!.textContent).toBe('aunque + subjuntivo')
    expect(container.textContent).toBe('Use aunque + subjuntivo for concessions.')
  })

  it('renders multiple bold segments', () => {
    const result = formatBold('Compare **ser** vs **estar** carefully.')
    const { container } = render(<>{result}</>)
    const strongs = container.querySelectorAll('strong')
    expect(strongs).toHaveLength(2)
    expect(strongs[0].textContent).toBe('ser')
    expect(strongs[1].textContent).toBe('estar')
    expect(container.textContent).toBe('Compare ser vs estar carefully.')
  })

  it('handles bold at the start of the string', () => {
    const result = formatBold('**Ser** is used for identity.')
    const { container } = render(<>{result}</>)
    const strong = container.querySelector('strong')
    expect(strong!.textContent).toBe('Ser')
  })

  it('handles bold at the end of the string', () => {
    const result = formatBold('This rule is called **concordancia**')
    const { container } = render(<>{result}</>)
    const strong = container.querySelector('strong')
    expect(strong!.textContent).toBe('concordancia')
  })
})
