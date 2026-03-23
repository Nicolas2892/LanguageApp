import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OfflineIndicator } from '../OfflineIndicator'

describe('OfflineIndicator', () => {
  it('renders offline message', () => {
    render(<OfflineIndicator />)
    expect(screen.getByText('Mostrando datos guardados')).toBeDefined()
  })

  it('shows cached timestamp when provided', () => {
    render(<OfflineIndicator cachedAt="2026-03-23T10:00:00Z" />)
    expect(screen.getByText('Mostrando datos guardados')).toBeDefined()
    // The timestamp text includes "Guardado" prefix
    expect(screen.getByText(/Guardado/)).toBeDefined()
  })

  it('does not show timestamp when not provided', () => {
    render(<OfflineIndicator />)
    expect(screen.queryByText(/Guardado/)).toBeNull()
  })
})
