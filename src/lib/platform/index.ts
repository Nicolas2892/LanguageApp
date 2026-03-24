export type Platform = 'web' | 'pwa' | 'native'

export function getPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'web'

  // iOS standalone check
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return 'pwa'

  // Android / desktop PWA check
  if (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) return 'pwa'

  return 'web'
}
