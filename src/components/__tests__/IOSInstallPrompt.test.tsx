import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { IOSInstallPrompt } from '../IOSInstallPrompt'

let mockPathname = '/dashboard'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

const IOS_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

const IOS_CHROME_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1'

function setUA(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
    writable: true,
  })
}

function setStandalone(value: boolean) {
  Object.defineProperty(navigator, 'standalone', {
    value,
    configurable: true,
    writable: true,
  })
}

let mockStorage: Record<string, string> = {}

describe('IOSInstallPrompt', () => {
  beforeEach(() => {
    mockPathname = '/dashboard'
    mockStorage = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value },
      removeItem: (key: string) => { delete mockStorage[key] },
    })
    setUA(IOS_SAFARI_UA)
    setStandalone(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows the sheet for iOS Safari when not standalone and not dismissed', async () => {
    await act(async () => {
      render(<IOSInstallPrompt />)
    })
    expect(screen.getByRole('dialog', { name: /install app prompt/i })).toBeTruthy()
  })

  it('hides when pwa_prompt_dismissed is true in localStorage', async () => {
    mockStorage['pwa_prompt_dismissed'] = 'true'
    await act(async () => {
      render(<IOSInstallPrompt />)
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('hides when navigator.standalone is true', async () => {
    setStandalone(true)
    await act(async () => {
      render(<IOSInstallPrompt />)
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('hides for non-iOS UA (Android Chrome)', async () => {
    setUA(ANDROID_CHROME_UA)
    await act(async () => {
      render(<IOSInstallPrompt />)
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('hides for iOS Chrome (CriOS token in UA)', async () => {
    setUA(IOS_CHROME_UA)
    await act(async () => {
      render(<IOSInstallPrompt />)
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('dismiss button removes the sheet and sets pwa_prompt_dismissed in localStorage', async () => {
    await act(async () => {
      render(<IOSInstallPrompt />)
    })
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i })
    await act(async () => {
      fireEvent.click(dismissBtn)
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mockStorage['pwa_prompt_dismissed']).toBe('true')
  })

  it('shows step instructions with Share and Add to Home Screen text', async () => {
    await act(async () => {
      render(<IOSInstallPrompt />)
    })
    expect(screen.getByText('Share')).toBeTruthy()
    expect(screen.getByText('Add to Home Screen')).toBeTruthy()
  })

  it('hides when pathname is /auth/login', async () => {
    mockPathname = '/auth/login'
    await act(async () => {
      render(<IOSInstallPrompt />)
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
