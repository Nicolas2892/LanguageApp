import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { TimezoneSync } from '../TimezoneSync'

describe('TimezoneSync', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<TimezoneSync serverTimezone="UTC" />)
      container = result.container
    })
    expect(container!.innerHTML).toBe('')
  })

  it('does not call fetch when server timezone matches client', async () => {
    const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    await act(async () => {
      render(<TimezoneSync serverTimezone={clientTz} />)
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls fetch to update timezone when server value differs', async () => {
    await act(async () => {
      render(<TimezoneSync serverTimezone="Antarctica/Troll" />)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/account/update')
    expect(opts.method).toBe('POST')
    const body = JSON.parse(opts.body)
    expect(body.timezone).toBeTruthy()
    expect(typeof body.timezone).toBe('string')
  })

  it('calls fetch when server timezone is null (first sync)', async () => {
    await act(async () => {
      render(<TimezoneSync serverTimezone={null} />)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('does not throw when fetch rejects', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    await act(async () => {
      render(<TimezoneSync serverTimezone="Antarctica/Troll" />)
    })
    // Should not throw — the rejection is caught silently
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
