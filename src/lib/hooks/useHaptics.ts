/**
 * useHaptics — lightweight haptic feedback via navigator.vibrate.
 * Gracefully no-ops on SSR and browsers that don't support the Vibration API.
 */
export function useHaptics() {
  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  return {
    /** Short single pulse — correct answer, success confirmation */
    triggerSuccess: () => vibrate(12),
    /** Double tap pattern — incorrect / error feedback */
    triggerError: () => vibrate([8, 40, 8]),
    /** Subtle tick — accent error (verb conjugation) */
    triggerWarning: () => vibrate(6),
  }
}
