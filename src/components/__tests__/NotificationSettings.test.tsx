import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { NotificationSettings } from '../NotificationSettings'

function stubNotification(permission: NotificationPermission | null) {
  if (permission === null) {
    vi.stubGlobal('Notification', undefined)
    return
  }
  vi.stubGlobal('Notification', {
    permission,
    requestPermission: vi.fn().mockResolvedValue(permission),
  })
}

function stubPushManager(available: boolean) {
  if (available) {
    vi.stubGlobal('PushManager', class PushManager {})
  } else {
    vi.stubGlobal('PushManager', undefined)
  }
}

describe('NotificationSettings', () => {
  beforeEach(() => {
    stubNotification('default')
    stubPushManager(true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows unsupported message when Notification API is absent', async () => {
    stubNotification(null)
    await act(async () => { render(<NotificationSettings />) })
    expect(screen.getByText(/no estan disponibles/i)).toBeTruthy()
  })

  it('shows blocked message when permission is denied', async () => {
    stubNotification('denied')
    await act(async () => { render(<NotificationSettings />) })
    expect(screen.getByText(/bloqueadas/i)).toBeTruthy()
  })

  it('shows active state and Desactivar button when permission is granted', async () => {
    stubNotification('granted')
    await act(async () => { render(<NotificationSettings />) })
    expect(screen.getByText(/notificaciones activas/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /desactivar/i })).toBeTruthy()
  })

  it('shows Activar notificaciones button when permission is default', async () => {
    stubNotification('default')
    await act(async () => { render(<NotificationSettings />) })
    expect(screen.getByRole('button', { name: /activar notificaciones/i })).toBeTruthy()
  })

  it('"Desactivar" calls DELETE /api/push/subscribe', async () => {
    stubNotification('granted')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await act(async () => { render(<NotificationSettings />) })
    await act(async () => {
      screen.getByRole('button', { name: /desactivar/i }).click()
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', { method: 'DELETE' })
  })

  it('does not show test push button when isAdmin is false', async () => {
    stubNotification('granted')
    await act(async () => { render(<NotificationSettings isAdmin={false} />) })
    expect(screen.queryByRole('button', { name: /enviar prueba/i })).toBeNull()
  })

  it('shows test push button when isAdmin is true and notifications are granted', async () => {
    stubNotification('granted')
    await act(async () => { render(<NotificationSettings isAdmin={true} />) })
    expect(screen.getByRole('button', { name: /enviar prueba/i })).toBeTruthy()
  })

  it('test push button calls POST /api/push/test', async () => {
    stubNotification('granted')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)
    await act(async () => { render(<NotificationSettings isAdmin={true} />) })
    await act(async () => {
      screen.getByRole('button', { name: /enviar prueba/i }).click()
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/push/test', { method: 'POST' })
  })

  it('shows iOS install hint when unsupported on iOS Safari tab', async () => {
    stubNotification(null)
    // Simulate iOS Safari (non-standalone)
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    })
    Object.defineProperty(navigator, 'standalone', {
      value: false,
      configurable: true,
    })
    await act(async () => { render(<NotificationSettings />) })
    expect(screen.getByText(/pantalla de inicio/i)).toBeTruthy()
  })
})
