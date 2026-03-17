import { useEffect, type RefObject } from 'react'

/**
 * Auto-focus an input/textarea without triggering iOS scroll-to-input.
 * Replaces the native `autoFocus` prop which causes viewport push-up on mobile.
 */
export function useAutoFocus(ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>, enabled = true) {
  useEffect(() => {
    if (enabled && ref.current) {
      ref.current.focus({ preventScroll: true })
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
