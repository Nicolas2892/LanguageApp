'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts'

export interface ExerciseAccuracy {
  type: string
  accuracy: number   // 0–100
  attempts: number
}

export const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  gap_fill:         { label: 'Completar Hueco',       color: '#fb923c' }, // orange-400
  translation:      { label: 'Traducción',             color: '#0ea5e9' }, // sky-500
  transformation:   { label: 'Transformación',         color: '#8b5cf6' }, // violet-500
  error_correction: { label: 'Corrección De Errores',  color: '#fb7185' }, // rose-400
  free_write:       { label: 'Escritura Libre',        color: '#10b981' }, // emerald-500
  sentence_builder: { label: 'Constructor De Frases',  color: '#f59e0b' }, // amber-400
}

const DEFAULT_COLOR = '#94a3b8' // slate-400

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { name: string; attempts: number } }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const { name, attempts } = payload[0].payload
  const accuracy = payload[0].value
  return (
    <div className="rounded-lg bg-card border shadow-sm px-3 py-2 text-sm">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">
        {accuracy}% · {attempts} attempt{attempts !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

interface Props {
  data: ExerciseAccuracy[]
}

export function AccuracyChart({ data }: Props) {
  const chartData = data.map((d) => {
    const cfg = TYPE_CONFIG[d.type]
    return {
      name: cfg?.label ?? d.type,
      accuracy: d.accuracy,
      attempts: d.attempts,
      color: cfg?.color ?? DEFAULT_COLOR,
      label: `${d.accuracy}% (${d.attempts})`,
    }
  })

  const height = Math.max(160, chartData.length * 52)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 100, left: 4, bottom: 4 }}
      >
        <XAxis
          type="number"
          domain={[0, 100]}
          unit="%"
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
        <Bar dataKey="accuracy" radius={[4, 4, 4, 4]} maxBarSize={28}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <LabelList
            dataKey="label"
            position="right"
            style={{ fontSize: 11, fill: 'var(--d5-body)' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
