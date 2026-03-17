import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ServiceWorkerRegistration } from '../ServiceWorkerRegistration'

describe('ServiceWorkerRegistration', () => {
  let addEventListenerSpy: ReturnType<typeof vi.fn>
  let removeEventListenerSpy: ReturnType<typeof vi.fn>
  let registerSpy: ReturnType<typeof vi.fn>
  let sessionStore: Record<string, string>

  beforeEach(() => {
    sessionStore = {}
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => sessionStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { sessionStore[key] = value }),
      removeItem: vi.fn((key: string) => { delete sessionStore[key] }),
    })

    addEventListenerSpy = vi.fn()
    removeEventListenerSpy = vi.fn()
    registerSpy = vi.fn().mockResolvedValue({ sync: { register: vi.fn().mockResolvedValue(undefined) } })

    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: registerSpy,
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
      },
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('does not register SW in non-production (test env)', () => {
    // NODE_ENV is 'test' by default in vitest — component guards on !== 'production'
    render(<ServiceWorkerRegistration />)
    expect(registerSpy).not.toHaveBeenCalled()
    expect(addEventListenerSpy).not.toHaveBeenCalled()
  })

  it('registers SW and controllerchange listener in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    render(<ServiceWorkerRegistration />)

    expect(registerSpy).toHaveBeenCalledWith('/sw.js', { scope: '/' })
    expect(addEventListenerSpy).toHaveBeenCalledWith('controllerchange', expect.any(Function))
  })

  it('reloads on controllerchange and sets sessionStorage guard', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const reloadSpy = vi.fn()
    vi.stubGlobal('location', { reload: reloadSpy })

    render(<ServiceWorkerRegistration />)

    // Get the handler that was registered
    const handler = addEventListenerSpy.mock.calls.find(
      (call: unknown[]) => call[0] === 'controllerchange',
    )?.[1] as (() => void) | undefined
    expect(handler).toBeDefined()

    handler!()

    expect(sessionStorage.setItem).toHaveBeenCalledWith('sw-reload', '1')
    expect(reloadSpy).toHaveBeenCalled()
  })

  it('does NOT reload if guard is already set (prevents loop)', () => {
    vi.stubEnv('NODE_ENV', 'production')
    sessionStore['sw-reload'] = '1'
    const reloadSpy = vi.fn()
    vi.stubGlobal('location', { reload: reloadSpy })

    render(<ServiceWorkerRegistration />)

    // Component clears the guard on mount, so set it back to simulate
    // a second controllerchange after a reload already happened
    sessionStore['sw-reload'] = '1'

    const handler = addEventListenerSpy.mock.calls.find(
      (call: unknown[]) => call[0] === 'controllerchange',
    )?.[1] as (() => void) | undefined

    handler!()

    expect(reloadSpy).not.toHaveBeenCalled()
  })

  it('cleans up listener on unmount', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { unmount } = render(<ServiceWorkerRegistration />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('controllerchange', expect.any(Function))
  })

  it('registers background sync after SW registration', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const syncRegister = vi.fn().mockResolvedValue(undefined)
    registerSpy.mockResolvedValue({ sync: { register: syncRegister } })

    render(<ServiceWorkerRegistration />)

    await vi.waitFor(() => {
      expect(syncRegister).toHaveBeenCalledWith('sync-offline-attempts')
    })
  })
})
