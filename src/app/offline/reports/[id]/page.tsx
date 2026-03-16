import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReportAttemptRow } from '@/components/offline/ReportAttemptRow'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import { MarkReviewedButton } from './MarkReviewedButton'
import type { OfflineReport, OfflineReportAttempt } from '@/lib/supabase/types'

export default async function OfflineReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rawReport } = await supabase
    .from('offline_reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!rawReport) redirect('/offline/reports')
  const report = rawReport as OfflineReport

  const { data: rawAttempts } = await supabase
    .from('offline_report_attempts')
    .select('*')
    .eq('report_id', id)
    .order('attempted_at')

  const attempts = (rawAttempts ?? []) as OfflineReportAttempt[]

  const date = new Date(report.created_at)
  const formattedDate = date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 animate-page-in relative overflow-hidden">
      <BackgroundMagicS opacity={0.04} />

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="senda-heading" style={{ fontSize: '1.625rem' }}>
          Informe Offline
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--d5-body)', marginTop: '0.25rem' }}>
          {formattedDate}
        </p>
      </div>

      {/* Summary card */}
      <div className="senda-card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--d5-ink)' }}>
              {report.correct_count}/{report.attempt_count} correctas
            </p>
            <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>
              {report.attempt_count} {report.attempt_count === 1 ? 'ejercicio calificado' : 'ejercicios calificados'}
            </p>
          </div>
          {report.accuracy !== null && (
            <div
              className="text-2xl font-bold"
              style={{
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
        </div>
      </div>

      {/* Attempts list */}
      <div className="mb-6">
        <span className="senda-eyebrow block mb-3">Resultados</span>
        {attempts.map(attempt => (
          <ReportAttemptRow key={attempt.id} attempt={attempt} />
        ))}
      </div>

      {/* Mark as reviewed */}
      {!report.reviewed && (
        <MarkReviewedButton reportId={report.id} />
      )}
    </main>
  )
}
