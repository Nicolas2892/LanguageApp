import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'
import type { OfflineReport } from '@/lib/supabase/types'

interface Props {
  report: OfflineReport
}

export function ReportCard({ report }: Props) {
  const date = new Date(report.created_at)
  const formattedDate = date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Link
      href={`/offline/reports/${report.id}`}
      className="senda-card flex items-center gap-3 group transition-shadow hover:shadow-md"
      style={{ textDecoration: 'none' }}
    >
      <div
        className="shrink-0 rounded-full flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          background: 'rgba(196,82,46,0.08)',
        }}
      >
        <FileText size={16} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)' }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--d5-ink)] dark:text-[var(--d5-paper)]">
          {report.attempt_count} {report.attempt_count === 1 ? 'ejercicio' : 'ejercicios'}
        </p>
        <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>
          {formattedDate}
        </p>
      </div>

      {report.accuracy !== null && (
        <div
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            background: report.accuracy >= 70
              ? 'rgba(34,197,94,0.1)'
              : report.accuracy >= 40
                ? 'rgba(245,158,11,0.1)'
                : 'rgba(239,68,68,0.1)',
            color: report.accuracy >= 70
              ? '#16a34a'
              : report.accuracy >= 40
                ? '#d97706'
                : '#dc2626',
          }}
        >
          {report.accuracy}%
        </div>
      )}

      <ChevronRight
        size={16}
        strokeWidth={1.5}
        className="shrink-0 opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ color: 'var(--d5-ink)' }}
      />
    </Link>
  )
}
