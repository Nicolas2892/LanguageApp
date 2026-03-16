'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNetworkStatus } from '@/lib/offline/useNetworkStatus'
import { getAllDownloadedModules } from '@/lib/offline/db'
import { OfflineStudySession } from './OfflineStudySession'
import { CloudOff, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Wrapper around the study page that detects offline state.
 * - Online → renders children (normal StudySession loaded by page.tsx)
 * - Offline + modules downloaded → renders OfflineStudySession
 * - Offline + nothing downloaded → shows fallback page
 */
export function OfflineGate({ children }: { children: React.ReactNode }) {
  const { isOnline } = useNetworkStatus()
  const [hasDownloads, setHasDownloads] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOnline) return
    getAllDownloadedModules().then(mods => setHasDownloads(mods.length > 0))
  }, [isOnline])

  // Online → normal flow
  if (isOnline) return <>{children}</>

  // Still checking downloads
  if (hasDownloads === null) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center animate-page-in">
        <p className="text-sm" style={{ color: 'var(--d5-muted)' }}>
          Verificando datos offline…
        </p>
      </div>
    )
  }

  // Offline + no downloads
  if (!hasDownloads) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center animate-page-in">
        <WifiOff size={32} strokeWidth={1.5} className="mx-auto mb-4" style={{ color: 'var(--d5-muted)' }} />
        <h2 className="senda-heading text-lg mb-2">Sin Conexión</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--d5-muted)' }}>
          No tienes módulos descargados para estudiar offline. Descarga módulos desde el currículo cuando tengas conexión.
        </p>
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="rounded-full"
        >
          Volver al inicio
        </Button>
      </div>
    )
  }

  // Offline + has downloads
  return <OfflineStudySession />
}
