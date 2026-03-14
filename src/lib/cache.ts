/**
 * Simple in-memory cache with TTL for static curriculum data (exercises, concepts).
 * Eliminates redundant DB round-trips during study sessions.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL_MS = 300_000 // 5 minutes

/**
 * Returns cached value if fresh, otherwise calls fetcher and caches the result.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T> | PromiseLike<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const existing = store.get(key)
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value as T
  }

  const value = await fetcher()
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

/**
 * Invalidate all entries whose key starts with the given prefix.
 */
export function invalidateCache(keyPrefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) {
      store.delete(key)
    }
  }
}

/**
 * Clear entire cache. Useful for tests.
 */
export function clearCache(): void {
  store.clear()
}
