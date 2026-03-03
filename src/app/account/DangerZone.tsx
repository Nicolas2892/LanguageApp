'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Trash2, AlertTriangle } from 'lucide-react'
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
      <h2 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <LogOut className="h-3.5 w-3.5" />
        Session
      </h2>
      <Button
        variant="outline"
        className="w-full rounded-full"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>

      <hr className="border-border" />

      {/* Delete Account — danger only */}
      <h2 className="flex items-center gap-1.5 text-xs font-semibold text-red-600 uppercase tracking-wide">
        <AlertTriangle className="h-3.5 w-3.5" />
        Danger zone
      </h2>

      {!confirming ? (
        <Button
          variant="outline"
          className="w-full rounded-full border-red-300 text-red-600 hover:bg-red-50"
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete account
        </Button>
      ) : (
        <div className="space-y-3 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">
            This will permanently delete your account and all progress. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
              onClick={handleDeleteConfirm}
            >
              {deleting ? 'Deleting…' : 'Yes, delete my account'}
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
