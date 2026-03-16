'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  streak: number
  freezeRemaining: number
  timezone?: string | null
}

interface CalendarData {
  studiedDates: string[]
  streak: number
  freezeRemaining: number
  freezeUsedDate: string | null
  lastStudiedDate: string | null
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function getMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1)
  const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** 0 = Mon, 6 = Sun (ISO week) */
function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export function StreakCalendarModal({ open, onOpenChange, streak, freezeRemaining, timezone }: Props) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const [viewYear, setViewYear] = useState(currentYear)
  const [viewMonth, setViewMonth] = useState(currentMonth)
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(false)

  const monthKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}`
  const isFutureMonth = viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth)
  const isCurrentMonth = viewYear === currentYear && viewMonth === currentMonth

  const fetchCalendar = useCallback(async (y: number, m: number) => {
    setLoading(true)
    try {
      const key = `${y}-${String(m).padStart(2, '0')}`
      const res = await fetch(`/api/streak/calendar?month=${key}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setViewYear(currentYear)
      setViewMonth(currentMonth)
      fetchCalendar(currentYear, currentMonth)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function navigateMonth(delta: -1 | 1) {
    let newMonth = viewMonth + delta
    let newYear = viewYear
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    // Don't navigate past current month
    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) return
    setViewMonth(newMonth)
    setViewYear(newYear)
    fetchCalendar(newYear, newMonth)
  }

  const studiedSet = new Set(data?.studiedDates ?? [])
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDayOffset = getFirstDayOfWeek(viewYear, viewMonth)

  const displayStreak = data?.streak ?? streak
  const displayFreeze = data?.freezeRemaining ?? freezeRemaining

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <svg
              width={40}
              height={40}
              viewBox="0 0 24 24"
              fill={displayStreak > 0 ? 'var(--d5-terracotta)' : 'var(--d5-muted)'}
              aria-hidden="true"
            >
              <path d="M12 23c-4.97 0-8-3.03-8-7.5 0-3.82 2.83-7.2 5.65-9.94a.75.75 0 0 1 1.12.12c.7 1.05 1.48 1.88 2.23 2.38.12-.93.43-2.2 1.15-3.56a.75.75 0 0 1 1.31-.05C17.3 7.8 20 11.58 20 15.5 20 19.97 16.97 23 12 23Zm-1.5-6.5c0 1.38.62 2.5 1.5 2.5s1.5-1.12 1.5-2.5c0-1.1-.5-2.2-1.5-3.5-1 1.3-1.5 2.4-1.5 3.5Z" />
            </svg>
            <DialogTitle className="senda-heading" style={{ fontSize: '1.5rem' }}>
              {displayStreak > 0
                ? `${displayStreak} ${displayStreak === 1 ? 'día' : 'días'} de racha`
                : 'Empieza tu racha'}
            </DialogTitle>
            <p style={{ fontSize: '0.75rem', color: 'var(--d5-body)' }}>
              {displayStreak > 0
                ? '¡Sigue así! Estudia cada día para mantener tu racha.'
                : 'Estudia hoy para comenzar una nueva racha.'}
            </p>
          </div>
        </DialogHeader>

        {/* Calendar */}
        <div className="px-6 pb-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigateMonth(-1)}
              aria-label="Mes anterior"
              className="p-1 rounded hover:bg-muted transition-colors"
              style={{ color: 'var(--d5-body)' }}
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--d5-heading)' }}
            >
              {getMonthLabel(viewYear, viewMonth)}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              aria-label="Mes siguiente"
              className="p-1 rounded hover:bg-muted transition-colors"
              style={{
                color: 'var(--d5-body)',
                opacity: isCurrentMonth ? 0.3 : 1,
                pointerEvents: isCurrentMonth ? 'none' : 'auto',
              }}
              disabled={isCurrentMonth}
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_LABELS.map(label => (
              <div
                key={label}
                className="text-center text-[0.625rem] font-medium"
                style={{ color: 'var(--d5-muted)' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-full senda-skeleton-fill animate-senda-pulse"
                  style={{ margin: 2 }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`
                const isStudied = studiedSet.has(dateStr)
                const isToday = dateStr === todayStr

                return (
                  <div
                    key={day}
                    className="flex items-center justify-center aspect-square"
                    style={{ position: 'relative' }}
                  >
                    {isStudied ? (
                      <div
                        className="flex items-center justify-center w-full h-full rounded-full"
                        style={{ background: 'rgba(196,82,46,0.12)' }}
                        title={`Estudiado: ${dateStr}`}
                      >
                        <svg
                          width={14}
                          height={14}
                          viewBox="0 0 24 24"
                          fill="var(--d5-terracotta)"
                          aria-label={`Estudiado ${dateStr}`}
                        >
                          <path d="M12 23c-4.97 0-8-3.03-8-7.5 0-3.82 2.83-7.2 5.65-9.94a.75.75 0 0 1 1.12.12c.7 1.05 1.48 1.88 2.23 2.38.12-.93.43-2.2 1.15-3.56a.75.75 0 0 1 1.31-.05C17.3 7.8 20 11.58 20 15.5 20 19.97 16.97 23 12 23Zm-1.5-6.5c0 1.38.62 2.5 1.5 2.5s1.5-1.12 1.5-2.5c0-1.1-.5-2.2-1.5-3.5-1 1.3-1.5 2.4-1.5 3.5Z" />
                        </svg>
                      </div>
                    ) : (
                      <span
                        className="text-xs"
                        style={{
                          color: isToday ? 'var(--d5-heading)' : 'var(--d5-muted)',
                          fontWeight: isToday ? 600 : 400,
                        }}
                      >
                        {day}
                      </span>
                    )}
                    {isToday && (
                      <span
                        style={{
                          position: 'absolute',
                          inset: 1,
                          borderRadius: '50%',
                          border: '1.5px solid var(--d5-terracotta)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Freeze card */}
        <div className="px-6 pb-6">
          <div
            className="senda-card flex items-center gap-3"
            style={{ padding: '0.75rem 1rem' }}
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke={displayFreeze > 0 ? 'var(--d5-terracotta)' : 'var(--d5-muted)'}
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
            </svg>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--d5-heading)' }}>
                {displayFreeze > 0
                  ? `${displayFreeze} ${displayFreeze === 1 ? 'Protección disponible' : 'Protecciones disponibles'}`
                  : 'Protección usada'}
              </p>
              <p className="text-[0.6875rem]" style={{ color: 'var(--d5-body)' }}>
                {displayFreeze > 0
                  ? 'Se activa automáticamente si faltas un día.'
                  : 'Se repone cada 7 días.'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
