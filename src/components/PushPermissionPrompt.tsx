'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

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

export function PushPermissionPrompt() {
  const [visible, setVisible] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    // Cast through unknown to handle environments where Notification may be undefined at runtime
    const notif = (window as unknown as Record<string, unknown>)['Notification'] as { permission?: string } | undefined
    if (
      !notif ||
      !('PushManager' in window) ||
      notif.permission !== 'default' ||
      localStorage.getItem(DISMISSED_KEY) === '1'
    ) return
    setVisible(true)
  }, [])

  if (!visible) return null

  async function handleEnable() {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        await subscribeToPush()
      }
    } catch {
      // silently fail — user can enable from account page later
    } finally {
      setVisible(false)
      setSubscribing(false)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="border rounded-xl p-4 bg-card text-left space-y-3">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-green-100 dark:bg-green-950/40 p-2 shrink-0">
          <Bell className="h-4 w-4 text-green-700 dark:text-green-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold">Never miss a review</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get a daily reminder when your streak is at risk.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleEnable}
          disabled={subscribing}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-transform disabled:opacity-60"
        >
          <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
          {subscribing ? 'Enabling…' : 'Enable notifications'}
        </button>
        <button
          onClick={handleDismiss}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted active:scale-95 transition-transform"
        >
          <BellOff className="h-3.5 w-3.5" strokeWidth={1.5} />
          Not now
        </button>
      </div>
    </div>
  )
}
