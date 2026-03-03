import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { IOSInstallCard } from '../IOSInstallCard'

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
  })
}

function setMaxTouchPoints(n: number) {
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: n,
    configurable: true,
  })
}

function setStandalone(value: boolean | undefined) {
  Object.defineProperty(navigator, 'standalone', {
    value,
    configurable: true,
  })
}

const IOS_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

const IOS_CHROME_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1'

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

describe('IOSInstallCard', () => {
  beforeEach(() => {
    setMaxTouchPoints(0)
    setStandalone(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing on non-iOS user agent', async () => {
    setUserAgent(DESKTOP_UA)
    await act(async () => {
      render(<IOSInstallCard />)
    })
    expect(screen.queryByText('Install on your iPhone')).toBeNull()
  })

  it('renders nothing when already installed (standalone mode)', async () => {
    setUserAgent(IOS_SAFARI_UA)
    setStandalone(true)
    await act(async () => {
      render(<IOSInstallCard />)
    })
    expect(screen.queryByText('Install on your iPhone')).toBeNull()
  })

  it('renders the install card on iOS Safari (non-standalone)', async () => {
    setUserAgent(IOS_SAFARI_UA)
    setStandalone(false)
    await act(async () => {
      render(<IOSInstallCard />)
    })
    expect(screen.getByText('Install on your iPhone')).toBeTruthy()
  })

  it('renders nothing on iOS Chrome (not Safari)', async () => {
    setUserAgent(IOS_CHROME_UA)
    setStandalone(false)
    await act(async () => {
      render(<IOSInstallCard />)
    })
    expect(screen.queryByText('Install on your iPhone')).toBeNull()
  })
})
