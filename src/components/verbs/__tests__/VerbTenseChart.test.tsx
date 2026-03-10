import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { VerbTenseChart } from '../VerbTenseChart'
import type { TenseSummary } from '../VerbTenseMastery'

// Mock recharts to avoid SVG/ResizeObserver issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar">{children}</div>
  ),
  XAxis: () => null,
  YAxis: () => null,
  LabelList: () => null,
  Cell: () => null,
}))

const sampleSummaries: TenseSummary[] = [
  { tense: 'present_indicative', correct: 80, attempts: 100, pct: 80 },
  { tense: 'preterite',          correct: 25, attempts:  50, pct: 50 },
  { tense: 'imperfect',          correct:  8, attempts:  40, pct: 20 },
]

describe('VerbTenseChart', () => {
  it('renders empty state when summaries is empty', () => {
    render(<VerbTenseChart summaries={[]} />)
    expect(screen.getByText('No verb practice data yet')).toBeInTheDocument()
  })

  it('renders the recharts bar chart when data is present', () => {
    render(<VerbTenseChart summaries={sampleSummaries} />)
    expect(screen.getByTestId('bar-chart')).toBeDefined()
  })

  it('does not render empty state when data is present', () => {
    render(<VerbTenseChart summaries={sampleSummaries} />)
    expect(screen.queryByText('No verb practice data yet')).toBeNull()
  })

  it('renders without error for a single tense', () => {
    const single: TenseSummary[] = [
      { tense: 'future', correct: 10, attempts: 20, pct: 50 },
    ]
    render(<VerbTenseChart summaries={single} />)
    expect(screen.getByTestId('bar-chart')).toBeDefined()
  })
})
