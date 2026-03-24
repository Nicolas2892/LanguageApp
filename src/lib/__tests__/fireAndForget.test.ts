import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockCaptureException } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: mockCaptureException,
}))

import { fireAndForget } from '../fireAndForget'

describe('fireAndForget', () => {
  beforeEach(() => {
    mockCaptureException.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does nothing when promise resolves', async () => {
    fireAndForget(Promise.resolve('ok'), 'test-resolve')
    await new Promise((r) => setTimeout(r, 10))
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('captures exception in Sentry when promise rejects', async () => {
    const error = new Error('test error')
    fireAndForget(Promise.reject(error), 'test-reject')
    await new Promise((r) => setTimeout(r, 10))
    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      tags: { fire_and_forget: 'test-reject' },
    })
  })

  it('includes the label in the Sentry tag', async () => {
    fireAndForget(Promise.reject(new Error('tagged')), 'my-label')
    await new Promise((r) => setTimeout(r, 10))
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { fire_and_forget: 'my-label' } }),
    )
  })

  it('does not throw when promise rejects', () => {
    // Should not throw — errors are caught internally
    expect(() => fireAndForget(Promise.reject(new Error('no throw')), 'safe')).not.toThrow()
  })
})
