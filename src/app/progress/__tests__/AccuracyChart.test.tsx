import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { AccuracyChart, TYPE_CONFIG } from '../AccuracyChart'
import type { ExerciseAccuracy } from '../AccuracyChart'

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
  Tooltip: () => null,
  LabelList: () => null,
  Cell: () => null,
}))

const sampleData: ExerciseAccuracy[] = [
  { type: 'gap_fill', accuracy: 80, attempts: 20 },
  { type: 'translation', accuracy: 65, attempts: 10 },
  { type: 'free_write', accuracy: 45, attempts: 5 },
]

describe('AccuracyChart', () => {
  it('renders without error with empty data', () => {
    const { container } = render(<AccuracyChart data={[]} />)
    expect(container).toBeDefined()
  })

  it('renders bar chart with valid data', () => {
    render(<AccuracyChart data={sampleData} />)
    expect(screen.getByTestId('bar-chart')).toBeDefined()
  })

  it('renders a single data point without crashing', () => {
    render(<AccuracyChart data={[{ type: 'translation', accuracy: 70, attempts: 3 }]} />)
    expect(screen.getByTestId('bar-chart')).toBeDefined()
  })
})

describe('TYPE_CONFIG', () => {
  it('has correct label for gap_fill', () => {
    expect(TYPE_CONFIG.gap_fill.label).toBe('Completar Hueco')
  })

  it('has correct label for translation', () => {
    expect(TYPE_CONFIG.translation.label).toBe('Traducción')
  })

  it('has correct label for transformation', () => {
    expect(TYPE_CONFIG.transformation.label).toBe('Transformación')
  })

  it('has correct label for error_correction', () => {
    expect(TYPE_CONFIG.error_correction.label).toBe('Corrección De Errores')
  })

  it('has correct label for free_write', () => {
    expect(TYPE_CONFIG.free_write.label).toBe('Escritura Libre')
  })

  it('has correct label for sentence_builder', () => {
    expect(TYPE_CONFIG.sentence_builder.label).toBe('Constructor De Frases')
  })

  it('has distinct colors for all six exercise types', () => {
    const colors = Object.values(TYPE_CONFIG).map((c) => c.color)
    expect(new Set(colors).size).toBe(colors.length)
  })
})
