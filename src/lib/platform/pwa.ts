/**
 * Returns true on iOS devices (iPhone, iPad, iPod).
 * Detects iPadOS (reports as Macintosh with touch points).
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
  )
}

/**
 * Returns true when the app is running as an installed PWA (standalone mode).
 */
export function isInstalledPWA(): boolean {
  if (typeof navigator === 'undefined') return false

  // iOS standalone check
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true

  // Android / desktop PWA check
  if (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) return true

  return false
}

/**
 * Returns true when running in Safari (not Chrome/Firefox/Opera/Edge on iOS).
 */
export function isSafariBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua)
}
