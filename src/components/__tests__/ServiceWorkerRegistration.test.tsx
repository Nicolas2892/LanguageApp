import { render, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ServiceWorkerRegistration } from '../ServiceWorkerRegistration'

describe('ServiceWorkerRegistration', () => {
  let registerSpy: ReturnType<typeof vi.fn>
  let swAddEventListenerSpy: ReturnType<typeof vi.fn>
  let swRemoveEventListenerSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    swAddEventListenerSpy = vi.fn()
    swRemoveEventListenerSpy = vi.fn()
    registerSpy = vi.fn().mockResolvedValue({
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      sync: { register: vi.fn().mockResolvedValue(undefined) },
    })

    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: registerSpy,
        addEventListener: swAddEventListenerSpy,
        removeEventListener: swRemoveEventListenerSpy,
        controller: {},
      },
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('does not register SW in non-production (test env)', () => {
    render(<ServiceWorkerRegistration />)
    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('registers SW in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    render(<ServiceWorkerRegistration />)
    expect(registerSpy).toHaveBeenCalledWith('/sw.js', { scope: '/' })
  })

  it('shows UpdateToast when registration has a waiting SW', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    registerSpy.mockResolvedValue({
      waiting: { postMessage: vi.fn(), state: 'installed' },
      installing: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      sync: { register: vi.fn().mockResolvedValue(undefined) },
    })

    render(<ServiceWorkerRegistration />)

    await vi.waitFor(() => {
      expect(screen.getByText('Actualización Disponible')).toBeInTheDocument()
    })
  })

  it('shows UpdateToast when new SW enters waiting state', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    let updateFoundCallback: (() => void) | null = null
    const mockInstalling = {
      state: 'installing' as string,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'statechange') {
          // Simulate statechange after a tick
          setTimeout(() => {
            mockInstalling.state = 'installed'
            cb()
          }, 0)
        }
      }),
    }

    registerSpy.mockResolvedValue({
      waiting: null,
      get installing() { return mockInstalling },
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'updatefound') updateFoundCallback = cb
      }),
      removeEventListener: vi.fn(),
      sync: { register: vi.fn().mockResolvedValue(undefined) },
    })

    render(<ServiceWorkerRegistration />)

    // Wait for registration to resolve
    await vi.waitFor(() => {
      expect(updateFoundCallback).not.toBeNull()
    })

    // Trigger updatefound
    updateFoundCallback!()

    await vi.waitFor(() => {
      expect(screen.getByText('Actualización Disponible')).toBeInTheDocument()
    })
  })

  it('sends SKIP_WAITING message when Actualizar is clicked', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const postMessageSpy = vi.fn()
    registerSpy.mockResolvedValue({
      waiting: { postMessage: postMessageSpy, state: 'installed' },
      installing: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      sync: { register: vi.fn().mockResolvedValue(undefined) },
    })

    render(<ServiceWorkerRegistration />)

    await vi.waitFor(() => {
      expect(screen.getByText('Actualizar')).toBeInTheDocument()
    })

    screen.getByText('Actualizar').click()

    expect(postMessageSpy).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })

  it('hides toast when dismiss is clicked', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const user = userEvent.setup()
    registerSpy.mockResolvedValue({
      waiting: { postMessage: vi.fn(), state: 'installed' },
      installing: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      sync: { register: vi.fn().mockResolvedValue(undefined) },
    })

    render(<ServiceWorkerRegistration />)

    await vi.waitFor(() => {
      expect(screen.getByText('Actualización Disponible')).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText('Cerrar'))

    expect(screen.queryByText('Actualización Disponible')).not.toBeInTheDocument()
  })

  it('registers background sync after SW registration', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const syncRegister = vi.fn().mockResolvedValue(undefined)
    registerSpy.mockResolvedValue({
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      sync: { register: syncRegister },
    })

    render(<ServiceWorkerRegistration />)

    await vi.waitFor(() => {
      expect(syncRegister).toHaveBeenCalledWith('sync-offline-attempts')
    })
  })
})
