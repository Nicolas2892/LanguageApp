import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReportCard } from '@/components/offline/ReportCard'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import type { OfflineReport } from '@/lib/supabase/types'

export default async function OfflineReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rawReports } = await supabase
    .from('offline_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const reports = (rawReports ?? []) as OfflineReport[]
  const unreviewed = reports.filter(r => !r.reviewed)
  const reviewed = reports.filter(r => r.reviewed)

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 animate-page-in relative overflow-hidden">
      <BackgroundMagicS opacity={0.04} />

      <div style={{ marginBottom: '2rem' }}>
        <h1 className="senda-heading" style={{ fontSize: '1.625rem' }}>
          Informes Offline
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--d5-body)', marginTop: '0.25rem' }}>
          Resultados de tus sesiones offline
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--d5-muted)' }}>
            No tienes informes pendientes.
          </p>
        </div>
      ) : (
        <>
          {unreviewed.length > 0 && (
            <div className="mb-6">
              <span className="senda-eyebrow block mb-3">Pendientes de Revisión</span>
              <div className="space-y-3">
                {unreviewed.map(report => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            </div>
          )}

          {reviewed.length > 0 && (
            <div>
              <span className="senda-eyebrow block mb-3">Revisados</span>
              <div className="space-y-3">
                {reviewed.map(report => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}
