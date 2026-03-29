import { useSyncExternalStore } from 'react'

const query = '(min-width: 1024px)'

function subscribe(cb: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const mql = window.matchMedia(query)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

function getSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(query).matches
}

function getServerSnapshot() {
  return false // SSR assumes mobile
}

/** Returns true when viewport is ≥ 1024px (Tailwind's `lg` breakpoint). SSR-safe. */
export function useIsLg() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
