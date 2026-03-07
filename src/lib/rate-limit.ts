/**
 * Sliding-window rate limiter.
 * Uses Vercel KV (Redis) in production for global consistency across all instances.
 * Falls back to in-memory when KV is not configured (local dev / CI).
 */
export interface RateLimitOptions {
  /** Maximum requests allowed within the window */
  maxRequests: number
  /** Window size in milliseconds */
  windowMs: number
}

// In-memory fallback for local dev and tests (instance-scoped but acceptable)
interface WindowEntry {
  count: number
  windowStart: number
}
const localStore = new Map<string, WindowEntry>()

/**
 * Check and record a rate-limit hit for the given key.
 * Returns `{ allowed: true }` if the request is within limits,
 * or `{ allowed: false }` if the limit has been exceeded.
 */
export async function checkRateLimit(
  userId: string,
  routeKey: string,
  opts: RateLimitOptions,
): Promise<{ allowed: boolean }> {
  const key = `rl:${routeKey}:${userId}`

  // Use KV when configured (production); fall back to in-memory for local dev
  if (process.env.KV_REST_API_URL) {
    try {
      const { kv } = await import('@vercel/kv')
      const windowSecs = Math.ceil(opts.windowMs / 1000)
      const count = await kv.incr(key)
      if (count === 1) await kv.expire(key, windowSecs)
      return { allowed: count <= opts.maxRequests }
    } catch (err) {
      console.error('[rate-limit] KV error, falling back to in-memory:', err)
      // fall through to in-memory below
    }
  }

  // In-memory fallback
  const now = Date.now()
  const entry = localStore.get(key)

  if (!entry || now - entry.windowStart >= opts.windowMs) {
    localStore.set(key, { count: 1, windowStart: now })
    return { allowed: true }
  }

  if (entry.count >= opts.maxRequests) {
    return { allowed: false }
  }

  entry.count += 1
  return { allowed: true }
}

/** Clear all in-memory rate-limit state (for tests). No-op in production (KV has TTL). */
export function clearRateLimitStore(): void {
  localStore.clear()
}
