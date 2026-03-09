import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminStatCard } from '../AdminStatCard'

describe('AdminStatCard', () => {
  it('renders the label and numeric value', () => {
    render(<AdminStatCard label="Total users" value={42} />)
    expect(screen.getByText('Total users')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders a string value', () => {
    render(<AdminStatCard label="Status" value="Active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders the optional sub text when provided', () => {
    render(<AdminStatCard label="Active today" value={5} sub="Users who studied today" />)
    expect(screen.getByText('Users who studied today')).toBeInTheDocument()
  })

  it('does not render sub text when omitted', () => {
    render(<AdminStatCard label="Concepts" value={85} />)
    expect(screen.queryByText('Users who studied today')).not.toBeInTheDocument()
  })

  it('renders zero value', () => {
    render(<AdminStatCard label="Attempts today" value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
