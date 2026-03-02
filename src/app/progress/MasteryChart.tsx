'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export interface ModuleMastery {
  module: string
  mastered: number
  learning: number
  total: number
}

interface Props {
  data: ModuleMastery[]
}

export function MasteryChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.module.replace(' & ', ' &\n'),
    Mastered: d.mastered,
    Learning: d.learning,
    'Not started': d.total - d.mastered - d.learning,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="Mastered" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Learning" stackId="a" fill="#3b82f6" />
        <Bar dataKey="Not started" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
