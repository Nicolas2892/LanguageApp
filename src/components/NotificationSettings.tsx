'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'

type NotifState = 'loading' | 'unsupported' | 'denied' | 'granted' | 'default'

const DISMISSED_KEY = 'push_prompt_dismissed'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const array = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i)
  return array
}

async function subscribeToPush(): Promise<boolean> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) return false

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  })
  return res.ok
}

export function NotificationSettings() {
  const [notifState, setNotifState] = useState<NotifState>('loading')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Cast through unknown to handle environments where Notification may be undefined at runtime
    const notif = (window as unknown as Record<string, unknown>)['Notification'] as { permission?: string } | undefined
    if (!notif || !('PushManager' in window)) {
      setNotifState('unsupported')
      return
    }
    setNotifState((notif.permission ?? 'default') as NotifState)
  }, [])

  async function handleEnable() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        await subscribeToPush()
        // Clear dismissed flag so post-session prompt won't show redundantly
        localStorage.removeItem(DISMISSED_KEY)
      }
      setNotifState(permission as NotifState)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    setLoading(true)
    try {
      await fetch('/api/push/subscribe', { method: 'DELETE' })
      // Permission remains 'granted' in browser — we only remove the server-side subscription
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BellRing size={15} strokeWidth={1.5} className="shrink-0 text-[var(--d5-ink)] dark:text-[var(--d5-paper)]" />
        <h2 className="text-sm font-semibold text-[var(--d5-warm)] dark:text-[var(--d5-muted)]">Notificaciones push</h2>
      </div>

      {notifState === 'loading' && (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      )}

      {notifState === 'unsupported' && (
        <p className="text-sm text-muted-foreground">
          Las notificaciones push no están disponibles en este navegador.
        </p>
      )}

      {notifState === 'denied' && (
        <p className="text-sm text-muted-foreground">
          Las notificaciones están bloqueadas. Actívalas en los ajustes de tu navegador para recibir recordatorios de racha.
        </p>
      )}

      {notifState === 'granted' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--d5-terracotta)' }}>
            <Bell size={14} strokeWidth={1.5} className="shrink-0" />
            <span>Notificaciones activas — recibirás un aviso cuando tu racha esté en riesgo.</span>
          </div>
          <button
            onClick={handleDisable}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted active:scale-95 transition-transform disabled:opacity-60"
          >
            <BellOff className="h-3.5 w-3.5" />
            {loading ? 'Desactivando…' : 'Desactivar'}
          </button>
        </div>
      )}

      {notifState === 'default' && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>
            Recibe un recordatorio diario cuando tu racha esté en riesgo.
          </p>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-transform disabled:opacity-60"
          >
            <Bell className="h-3.5 w-3.5" />
            {loading ? 'Activando…' : 'Activar notificaciones'}
          </button>
        </div>
      )}
    </div>
  )
}
