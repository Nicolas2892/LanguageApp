import { useEffect, type RefObject } from 'react'

/**
 * Focus an input/textarea without iOS Safari scrolling the page.
 *
 * iOS Safari ignores `focus({ preventScroll: true })`. The only reliable
 * workaround is the "transform hack": move the element far off-screen via
 * CSS transform before focusing, so Safari has nothing to scroll to, then
 * immediately restore the transform. The browser paints the keyboard
 * without any scroll offset change.
 *
 * Ref: https://gist.github.com/kiding/72721a0553fa93198ae2bb6eefaa3299
 */
export function focusWithoutScroll(el: HTMLElement | null) {
  if (!el) return
  const scrollY = window.scrollY
  el.style.transform = 'translateY(-9999px)'
  el.focus()
  requestAnimationFrame(() => {
    el.style.transform = ''
    window.scrollTo(0, scrollY)
  })
}

/**
 * Auto-focus an input/textarea on mount without triggering iOS scroll.
 * Replaces the native `autoFocus` prop.
 */
export function useAutoFocus(ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>, enabled = true) {
  useEffect(() => {
    if (enabled) {
      focusWithoutScroll(ref.current)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
