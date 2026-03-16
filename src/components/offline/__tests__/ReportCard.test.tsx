import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportCard } from '../ReportCard'
import type { OfflineReport } from '@/lib/supabase/types'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

function makeReport(overrides: Partial<OfflineReport> = {}): OfflineReport {
  return {
    id: 'r1',
    user_id: 'u1',
    session_id: 's1',
    attempt_count: 10,
    correct_count: 7,
    accuracy: 70,
    reviewed: false,
    created_at: '2026-03-15T14:30:00Z',
    ...overrides,
  }
}

describe('ReportCard', () => {
  it('renders exercise count and accuracy', () => {
    render(<ReportCard report={makeReport()} />)
    expect(screen.getByText('10 ejercicios')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
  })

  it('uses singular for 1 exercise', () => {
    render(<ReportCard report={makeReport({ attempt_count: 1 })} />)
    expect(screen.getByText('1 ejercicio')).toBeInTheDocument()
  })

  it('links to report detail page', () => {
    render(<ReportCard report={makeReport({ id: 'abc-123' })} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/offline/reports/abc-123')
  })

  it('does not render accuracy when null', () => {
    render(<ReportCard report={makeReport({ accuracy: null })} />)
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })
})
