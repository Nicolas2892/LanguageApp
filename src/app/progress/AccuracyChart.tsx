'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface ExerciseAccuracy {
  type: string
  accuracy: number   // 0–100
  attempts: number
}

interface Props {
  data: ExerciseAccuracy[]
}

const TYPE_LABELS: Record<string, string> = {
  gap_fill: 'Gap fill',
  transformation: 'Transform',
  translation: 'Translation',
  error_correction: 'Error fix',
  free_write: 'Free write',
  sentence_builder: 'Sentence',
}

export function AccuracyChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: TYPE_LABELS[d.type] ?? d.type,
    Accuracy: d.accuracy,
    attempts: d.attempts,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
        <Tooltip
          formatter={(val, _name, props) =>
            [`${val ?? 0}% (${props.payload.attempts} attempts)`, 'Accuracy']
          }
        />
        <Bar dataKey="Accuracy" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
