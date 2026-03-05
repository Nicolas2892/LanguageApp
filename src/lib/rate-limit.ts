/**
 * Simple in-memory sliding-window rate limiter.
 * Stored in module scope — survives Vercel warm instances; acceptable at current scale.
 */

interface WindowEntry {
  count: number
  windowStart: number
}

const store = new Map<string, WindowEntry>()

export interface RateLimitOptions {
  /** Maximum requests allowed within the window */
  maxRequests: number
  /** Window size in milliseconds */
  windowMs: number
}

/**
 * Check and record a rate-limit hit for the given key.
 * Returns `{ allowed: true }` if the request is within limits,
 * or `{ allowed: false }` if the limit has been exceeded.
 */
export function checkRateLimit(
  userId: string,
  routeKey: string,
  opts: RateLimitOptions,
): { allowed: boolean } {
  const key = `${routeKey}:${userId}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= opts.windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true }
  }

  if (entry.count >= opts.maxRequests) {
    return { allowed: false }
  }

  entry.count += 1
  return { allowed: true }
}

/** Clear all rate-limit state (for tests). */
export function clearRateLimitStore(): void {
  store.clear()
}
