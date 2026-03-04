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
    expect(screen.getByText(/not supported/i)).toBeTruthy()
  })

  it('shows blocked message when permission is denied', async () => {
    stubNotification('denied')
    await act(async () => { render(<NotificationSettings />) })
    expect(screen.getByText(/blocked/i)).toBeTruthy()
  })

  it('shows active state and Turn off button when permission is granted', async () => {
    stubNotification('granted')
    await act(async () => { render(<NotificationSettings />) })
    expect(screen.getByText(/notifications active/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /turn off/i })).toBeTruthy()
  })

  it('shows Enable notifications button when permission is default', async () => {
    stubNotification('default')
    await act(async () => { render(<NotificationSettings />) })
    expect(screen.getByRole('button', { name: /enable notifications/i })).toBeTruthy()
  })

  it('"Turn off" calls DELETE /api/push/subscribe', async () => {
    stubNotification('granted')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await act(async () => { render(<NotificationSettings />) })
    await act(async () => {
      screen.getByRole('button', { name: /turn off/i }).click()
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', { method: 'DELETE' })
  })
})
