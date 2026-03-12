'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function DangerZone() {
  const router = useRouter()
  const supabase = createClient()

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Error al eliminar la cuenta')
      router.push('/auth/login')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Algo salió mal.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Sign Out — neutral section */}
      <span className="senda-eyebrow">Sesión</span>
      <Button
        variant="outline"
        className="w-full rounded-full"
        onClick={handleSignOut}
      >
        <LogOut size={15} strokeWidth={1.5} className="mr-2 text-[var(--d5-ink)] dark:text-[var(--d5-paper)]" />
        Cerrar sesión
      </Button>

      <div className="mt-6 mb-2" />

      {/* Delete Account — danger only */}
      <span className="senda-eyebrow">Zona de peligro</span>

      {!confirming ? (
        <Button
          variant="outline"
          className="w-full rounded-full bg-red-50 text-red-600 hover:bg-red-100 border-none dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30"
          onClick={() => setConfirming(true)}
        >
          <Trash2 size={15} strokeWidth={1.5} className="mr-2" />
          Eliminar cuenta
        </Button>
      ) : (
        <div className="space-y-3 rounded-xl p-4" style={{ background: 'var(--d5-error-surface)', boxShadow: '0 10px 30px -10px rgba(26,17,8,0.06)' }}>
          <p className="text-sm text-red-700">
            Esto eliminará permanentemente tu cuenta y todo tu progreso. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
              onClick={handleDeleteConfirm}
            >
              {deleting ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
            </Button>
          </div>
          {deleteError && (
            <p className="text-sm text-red-600 rounded-lg p-3" style={{ background: 'var(--d5-error-surface)' }}>{deleteError}</p>
          )}
        </div>
      )}
    </div>
  )
}
