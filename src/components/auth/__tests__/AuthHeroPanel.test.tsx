import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthHeroPanel } from '../AuthHeroPanel'

describe('AuthHeroPanel', () => {
  it('renders SvgSendaPath SVG', () => {
    const { container } = render(<AuthHeroPanel />)
    const svg = container.querySelector('svg[viewBox="0 0 24 24"]')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '96')
  })

  it('renders "Senda" wordmark with senda-heading class', () => {
    render(<AuthHeroPanel />)
    const heading = screen.getByText('Senda')
    expect(heading).toHaveClass('senda-heading')
    expect(heading.tagName).toBe('H1')
  })

  it('renders tagline text', () => {
    render(<AuthHeroPanel />)
    expect(screen.getByText('Tu camino al español avanzado')).toBeInTheDocument()
  })

  it('has hidden and lg:flex classes for desktop-only display', () => {
    const { container } = render(<AuthHeroPanel />)
    const panel = container.firstChild as HTMLElement
    expect(panel.className).toContain('hidden')
    expect(panel.className).toContain('lg:flex')
  })

  it('contains BackgroundMagicS decorative SVG', () => {
    const { container } = render(<AuthHeroPanel />)
    const magicS = container.querySelector('svg[viewBox="0 0 200 260"]')
    expect(magicS).toBeInTheDocument()
  })
})
