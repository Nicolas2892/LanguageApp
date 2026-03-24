'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { useOfflineDashboard } from '@/lib/offline/hooks'
import { isOnline } from '@/lib/platform/network'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const isOffline = !isOnline()
  const { data, loading } = useOfflineDashboard()

  // Online error → standard error boundary
  if (!isOffline) {
    return (
      <main className="max-w-2xl mx-auto px-5 pt-16 text-center space-y-4 animate-page-in">
        <h2 className="senda-heading text-xl">Algo salió mal</h2>
        <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
          Ha ocurrido un error inesperado.
        </p>
        <button onClick={reset} className="senda-cta-outline">
          Reintentar
        </button>
      </main>
    )
  }

  // Offline: show cached dashboard data
  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-5 pt-5 pb-24 animate-page-in">
        <div className="senda-skeleton-fill animate-senda-pulse h-6 w-48 rounded mb-4" />
        <div className="senda-skeleton-fill animate-senda-pulse h-32 rounded-2xl" />
      </main>
    )
  }

  const profile = data?.profile
  const stats = data?.stats
  const downloadedModules = data?.downloadedModules ?? []

  return (
    <main className="max-w-2xl mx-auto px-5 pt-5 pb-24 lg:px-8 lg:pt-8 animate-page-in">
      <OfflineIndicator cachedAt={stats?.cached_at ?? profile?.cached_at} />

      {/* Greeting */}
      <div className="mb-4">
        <h1 className="senda-heading text-2xl">
          Hola, {(profile?.display_name ?? 'learner').split(' ')[0]}.
        </h1>
        {profile?.computed_level && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 mt-1 inline-block">
            Nivel {profile.computed_level}
          </span>
        )}
      </div>

      {/* Cached stats */}
      {stats && (
        <div className="senda-card space-y-2 mb-4">
          <p className="senda-eyebrow">Última Sesión</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--d5-terracotta)' }}>{stats.due_count}</p>
              <p className="text-[9px]" style={{ color: 'var(--d5-muted)' }}>pendientes</p>
            </div>
            <div>
              <p className="text-lg font-bold">{stats.studied_count}</p>
              <p className="text-[9px]" style={{ color: 'var(--d5-muted)' }}>estudiados</p>
            </div>
            <div>
              <p className="text-lg font-bold">{stats.total_concepts}</p>
              <p className="text-[9px]" style={{ color: 'var(--d5-muted)' }}>total</p>
            </div>
          </div>
        </div>
      )}

      {/* Offline actions */}
      {downloadedModules.length > 0 && (
        <Link href="/study" className="senda-cta w-full block text-center mb-3">
          Estudiar Offline
        </Link>
      )}
      <Link href="/verbs/configure" className="senda-cta-outline w-full block text-center">
        Practicar Verbos
      </Link>
    </main>
  )
}
