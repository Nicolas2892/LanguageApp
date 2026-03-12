import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { PushPermissionPrompt } from '../PushPermissionPrompt'

let mockStorage: Record<string, string> = {}

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
    // PushManager already available via window in most setups; just ensure it's truthy
    vi.stubGlobal('PushManager', class PushManager {})
  } else {
    vi.stubGlobal('PushManager', undefined)
  }
}

describe('PushPermissionPrompt', () => {
  beforeEach(() => {
    mockStorage = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value },
      removeItem: (key: string) => { delete mockStorage[key] },
    })
    // Default: supported + default permission + not dismissed
    stubNotification('default')
    stubPushManager(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns null when Notification API is not in window', async () => {
    stubNotification(null)
    await act(async () => { render(<PushPermissionPrompt />) })
    expect(screen.queryByText(/no pierdas/i)).toBeNull()
  })

  it('returns null when permission is granted', async () => {
    stubNotification('granted')
    await act(async () => { render(<PushPermissionPrompt />) })
    expect(screen.queryByText(/no pierdas/i)).toBeNull()
  })

  it('returns null when permission is denied', async () => {
    stubNotification('denied')
    await act(async () => { render(<PushPermissionPrompt />) })
    expect(screen.queryByText(/no pierdas/i)).toBeNull()
  })

  it('returns null when localStorage dismissed flag is set', async () => {
    mockStorage['push_prompt_dismissed'] = '1'
    await act(async () => { render(<PushPermissionPrompt />) })
    expect(screen.queryByText(/no pierdas/i)).toBeNull()
  })

  it('renders the prompt when all conditions are met', async () => {
    await act(async () => { render(<PushPermissionPrompt />) })
    expect(screen.getByText(/no pierdas/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /activar notificaciones/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /ahora no/i })).toBeTruthy()
  })

  it('"Not now" sets localStorage flag and hides the prompt', async () => {
    await act(async () => { render(<PushPermissionPrompt />) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ahora no/i }))
    })
    expect(screen.queryByText(/no pierdas/i)).toBeNull()
    expect(mockStorage['push_prompt_dismissed']).toBe('1')
  })
})
