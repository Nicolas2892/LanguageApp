'use client'

import { useState, useEffect } from 'react'

export interface WeekData {
  weekStart: string  // YYYY-MM-DD (Monday)
  count: number
}

interface Props {
  data: WeekData[]
  sessionCount: number
  totalMinutes: number
  uniqueDaysStudied: number
}

function getBarColor(count: number): string {
  if (count === 0) return 'var(--muted)'
  if (count <= 2) return 'var(--d5-muted)'
  if (count <= 5) return 'var(--d5-warm)'
  return 'var(--d5-terracotta)'
}

function formatWeekTooltip(weekStart: string, count: number): string {
  const date = new Date(weekStart + 'T00:00:00')
  const day = date.getDate()
  const month = date.toLocaleString('es', { month: 'short' })
  return `Semana del ${day} ${month}: ${count} ejercicio${count !== 1 ? 's' : ''}`
}

export function WeeklyActivityChart({ data, sessionCount, totalMinutes, uniqueDaysStudied }: Props) {
  const [mounted, setMounted] = useState(false)
  const [selectedBar, setSelectedBar] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const maxCount = Math.max(...data.map((w) => w.count), 1)
  const MAX_HEIGHT = 120

  // Compute month labels: show month name at the first week of each month
  const monthLabels = data.map((week, i) => {
    const date = new Date(week.weekStart + 'T00:00:00')
    const day = date.getDate()
    if (day <= 7) {
      return date.toLocaleString('es', { month: 'short' })
    }
    // Also show label on the first bar
    if (i === 0) {
      return date.toLocaleString('es', { month: 'short' })
    }
    return ''
  })

  return (
    <section className="space-y-4">
      <div>
        <p className="senda-eyebrow" style={{ color: 'var(--d5-muted)' }}>Consistencia De Estudio</p>

        {/* Stats row */}
        <div className="flex items-baseline justify-between mt-1.5 gap-4">
          <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>
            {sessionCount > 0 && (
              <>
                <span className="font-medium" style={{ color: 'var(--d5-warm)' }}>
                  {sessionCount} Sesion{sessionCount !== 1 ? 'es' : ''}
                </span>{' '}
                Este Mes
                {totalMinutes > 0 && (
                  <>
                    {' '}·{' '}
                    <span className="font-medium" style={{ color: 'var(--d5-warm)' }}>
                      {(totalMinutes / 60).toFixed(1)} hrs
                    </span>
                  </>
                )}
              </>
            )}
          </p>
          <p className="text-xs shrink-0" style={{ color: 'var(--d5-muted)' }}>
            <span className="font-medium" style={{ color: 'var(--d5-warm)' }}>
              {uniqueDaysStudied} Día{uniqueDaysStudied !== 1 ? 's' : ''}
            </span>{' '}
            · 3 Meses
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="senda-card" onClick={(e) => { if (e.target === e.currentTarget) setSelectedBar(null) }}>
        <div
          className="flex items-end gap-1"
          style={{ height: MAX_HEIGHT }}
        >
          {data.map((week, i) => {
            const heightPct = week.count > 0 ? Math.max((week.count / maxCount) * 100, 4) : 2
            const barHeight = (heightPct / 100) * MAX_HEIGHT

            const isSelected = selectedBar === i

            return (
              <div
                key={week.weekStart}
                className="flex-1 flex items-end justify-center group relative cursor-pointer"
                style={{ height: MAX_HEIGHT }}
                onClick={() => setSelectedBar(isSelected ? null : i)}
              >
                {/* Tooltip — visible on hover (desktop) or tap (mobile) */}
                <div
                  className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap
                             rounded px-2 py-1 text-[10px] font-medium
                             transition-opacity pointer-events-none z-10
                             ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  style={{
                    background: 'var(--d5-ink)',
                    color: 'var(--d5-paper)',
                  }}
                >
                  {formatWeekTooltip(week.weekStart, week.count)}
                </div>

                {/* Bar */}
                <div
                  className="w-full rounded-t-sm transition-all duration-500 ease-out"
                  style={{
                    height: mounted ? barHeight : 0,
                    maxWidth: 28,
                    background: getBarColor(week.count),
                    transitionDelay: `${i * 30}ms`,
                    transform: isSelected ? 'scaleY(1.05)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Month labels */}
        <div className="flex gap-1 mt-2">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="flex-1 text-center text-[10px] capitalize"
              style={{ color: 'var(--d5-muted)' }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-[10px]" style={{ color: 'var(--d5-muted)' }}>
          <span>Menos</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-muted" />
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--d5-muted)' }} />
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--d5-warm)' }} />
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--d5-terracotta)' }} />
          <span>Más</span>
        </div>
      </div>
    </section>
  )
}
