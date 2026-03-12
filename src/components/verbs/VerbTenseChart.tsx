'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from 'recharts'
import { TENSE_LABELS } from '@/lib/verbs/constants'
import type { VerbTense } from '@/lib/verbs/constants'
import type { TenseSummary } from './VerbTenseMastery'

function barColor(pct: number): string {
  if (pct >= 70) return '#22c55e'
  if (pct >= 40) return '#fbbf24'
  return '#fb7185'
}

interface Props {
  summaries: TenseSummary[]
}

export function VerbTenseChart({ summaries }: Props) {
  if (summaries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No verb practice data yet
      </p>
    )
  }

  const chartData = summaries.map((s) => ({
    name: TENSE_LABELS[s.tense as VerbTense] ?? s.tense,
    pct: s.pct,
  }))

  const height = Math.max(200, chartData.length * 52)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
      >
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={130}
        />
        <Bar dataKey="pct" radius={[4, 4, 4, 4]} maxBarSize={28}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={barColor(entry.pct)} />
          ))}
          <LabelList
            dataKey="pct"
            position="right"
            formatter={(v: unknown) => `${v}%`}
            style={{ fontSize: 11, fill: 'var(--d5-warm)' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
