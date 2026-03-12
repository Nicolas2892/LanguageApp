'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts'
import { TYPE_CONFIG } from '@/app/progress/AccuracyChart'

const DEFAULT_COLOR = '#94a3b8'

export interface ExerciseTypeCount {
  type: string
  count: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { name: string } }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const { name } = payload[0].payload
  const count = payload[0].value
  return (
    <div className="rounded-lg bg-card border shadow-sm px-3 py-2 text-sm">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">{count} attempt{count !== 1 ? 's' : ''}</p>
    </div>
  )
}

interface Props {
  data: ExerciseTypeCount[]
}

export function ExerciseTypeChart({ data }: Props) {
  const chartData = data.map((d) => {
    const cfg = TYPE_CONFIG[d.type]
    return {
      name: cfg?.label ?? d.type,
      count: d.count,
      color: cfg?.color ?? DEFAULT_COLOR,
    }
  })

  const height = Math.max(160, chartData.length * 52)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[4, 4, 4, 4]} maxBarSize={28}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fontSize: 11, fill: 'var(--d5-body)' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
