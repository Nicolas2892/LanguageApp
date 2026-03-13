'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing, Send } from 'lucide-react'

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

/** Detect iOS Safari running as a browser tab (not installed as PWA) */
function isIOSSafariTab(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isStandalone = 'standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true
  return isIOS && !isStandalone
}

interface NotificationSettingsProps {
  isAdmin?: boolean
}

export function NotificationSettings({ isAdmin = false }: NotificationSettingsProps) {
  const [notifState, setNotifState] = useState<NotifState>('loading')
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [subscribeError, setSubscribeError] = useState(false)
  const [iosSafariTab, setIosSafariTab] = useState(false)

  useEffect(() => {
    // Detect iOS Safari tab for install hint
    setIosSafariTab(isIOSSafariTab())

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
    setSubscribeError(false)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const ok = await subscribeToPush()
        if (!ok) {
          setSubscribeError(true)
        } else {
          // Clear dismissed flag so post-session prompt won't show redundantly
          localStorage.removeItem(DISMISSED_KEY)
        }
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

  async function handleTestPush() {
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      if (res.ok) {
        setTestResult({ ok: true, message: 'Notificacion enviada' })
      } else {
        const body = await res.json().catch(() => ({ error: 'Error desconocido' }))
        setTestResult({ ok: false, message: body.error ?? `Error ${res.status}` })
      }
    } catch {
      setTestResult({ ok: false, message: 'Error de red' })
    } finally {
      setTestLoading(false)
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
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Las notificaciones push no estan disponibles en este navegador.
          </p>
          {iosSafariTab && (
            <p className="text-xs" style={{ color: 'var(--d5-terracotta)' }}>
              En iOS, instala la app primero: toca <strong>Compartir</strong> → <strong>Anadir a pantalla de inicio</strong> y abre desde ahi para activar notificaciones.
            </p>
          )}
        </div>
      )}

      {notifState === 'denied' && (
        <p className="text-sm text-muted-foreground">
          Las notificaciones estan bloqueadas. Activalas en los ajustes de tu navegador para recibir recordatorios de racha.
        </p>
      )}

      {notifState === 'granted' && (
        <div className="space-y-2">
          {subscribeError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              No se pudo registrar la suscripción. Inténtalo de nuevo.
            </p>
          )}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--d5-terracotta)' }}>
            <Bell size={14} strokeWidth={1.5} className="shrink-0" />
            <span>Notificaciones activas — recibiras un aviso cuando tu racha este en riesgo.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDisable}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 min-h-[44px] text-xs font-medium text-muted-foreground hover:bg-muted active:scale-95 transition-transform disabled:opacity-60"
            >
              <BellOff className="h-3.5 w-3.5" />
              {loading ? 'Desactivando…' : 'Desactivar'}
            </button>
            {isAdmin && (
              <button
                onClick={handleTestPush}
                disabled={testLoading}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 active:scale-95 transition-transform disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                {testLoading ? 'Enviando…' : 'Enviar prueba'}
              </button>
            )}
          </div>
          {testResult && (
            <p className={`text-xs ${testResult.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {testResult.message}
            </p>
          )}
        </div>
      )}

      {notifState === 'default' && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>
            Recibe un recordatorio diario cuando tu racha este en riesgo.
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
