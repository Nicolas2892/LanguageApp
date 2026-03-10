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
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete account')
      router.push('/auth/login')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong.')
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
        <LogOut className="h-4 w-4 mr-2" />
        Cerrar sesión
      </Button>

      <div className="mt-6 mb-2" />

      {/* Delete Account — danger only */}
      <span className="senda-eyebrow text-red-600">Zona de peligro</span>

      {!confirming ? (
        <Button
          variant="outline"
          className="w-full rounded-full border-red-300 text-red-600 hover:bg-red-50"
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar cuenta
        </Button>
      ) : (
        <div className="space-y-3 border border-red-200 rounded-xl p-4">
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
            <p className="text-sm text-red-600 border border-red-200 rounded-lg p-3">{deleteError}</p>
          )}
        </div>
      )}
    </div>
  )
}
