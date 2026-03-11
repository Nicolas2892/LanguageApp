'use client'

export interface DayActivity {
  date: string   // YYYY-MM-DD
  count: number
}

interface Props {
  data: DayActivity[]
  weeks?: number
}

function getColorStyle(count: number): { className?: string; style?: React.CSSProperties } {
  if (count === 0) return { className: 'bg-muted' }
  if (count <= 2) return { style: { background: 'var(--d5-muted)' } }
  if (count <= 5) return { style: { background: 'var(--d5-warm)' } }
  return { style: { background: 'var(--d5-terracotta)' } }
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

export function ActivityHeatmap({ data, weeks = 14 }: Props) {
  // Build a map of date → count
  const countByDate = new Map(data.map((d) => [d.date, d.count]))

  // Generate the last `weeks` weeks of dates, starting from the most recent Monday
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const lastMonday = new Date(today)
  lastMonday.setDate(today.getDate() - daysSinceMonday)

  const grid: Array<Array<{ date: string; count: number }>> = []
  for (let w = weeks - 1; w >= 0; w--) {
    const week: Array<{ date: string; count: number }> = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(lastMonday)
      date.setDate(lastMonday.getDate() - w * 7 + d)
      const iso = date.toISOString().split('T')[0]
      week.push({ date: iso, count: countByDate.get(iso) ?? 0 })
    }
    grid.push(week)
  }

  // Month labels: show month name when week starts a new month
  const monthLabels = grid.map((week) => {
    const firstDate = new Date(week[0].date)
    return firstDate.getDate() <= 7
      ? firstDate.toLocaleString('default', { month: 'short' })
      : ''
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-1 mr-1 justify-around">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="text-[10px] text-muted-foreground w-6 text-right leading-3">
              {label}
            </span>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex flex-col gap-1">
          {/* Month labels row */}
          <div className="flex gap-1">
            {monthLabels.map((label, i) => (
              <span key={i} className="text-[10px] text-muted-foreground w-3 text-center">
                {label}
              </span>
            ))}
          </div>
          {/* Grid: rows = days, cols = weeks */}
          {Array.from({ length: 7 }, (_, dayIdx) => (
            <div key={dayIdx} className="flex gap-1">
              {grid.map((week, weekIdx) => {
                const cell = week[dayIdx]
                return (
                  <div
                    key={weekIdx}
                    title={`${cell.date}: ${cell.count} exercise${cell.count !== 1 ? 's' : ''}`}
                    className={`w-3 h-3 rounded-sm ${getColorStyle(cell.count).className ?? ''}`}
                    style={getColorStyle(cell.count).style}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-muted" />
        <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--d5-muted)' }} />
        <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--d5-warm)' }} />
        <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--d5-terracotta)' }} />
        <span>More</span>
      </div>
    </div>
  )
}
