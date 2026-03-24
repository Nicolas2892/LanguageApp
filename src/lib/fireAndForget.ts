import * as Sentry from '@sentry/nextjs'

/**
 * Attach error logging to a fire-and-forget promise.
 * Does not change control flow — the promise result is still ignored.
 * Errors are sent to Sentry and logged in development.
 */
export function fireAndForget(promise: Promise<unknown>, label: string): void {
  promise.catch((err) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[fireAndForget:${label}]`, err)
    }
    Sentry.captureException(err, { tags: { fire_and_forget: label } })
  })
}
