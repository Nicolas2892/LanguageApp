'use client'

import { useEffect } from 'react'

interface TimezoneSyncProps {
  serverTimezone: string | null
}

/**
 * Invisible component that auto-syncs the browser's IANA timezone
 * to the user's profile when it differs from the stored value.
 */
export function TimezoneSync({ serverTimezone }: TimezoneSyncProps) {
  useEffect(() => {
    try {
      const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!clientTz || clientTz === serverTimezone) return

      fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: clientTz }),
      }).catch(() => {
        // Silent — timezone sync is best-effort
      })
    } catch {
      // Intl not available — skip
    }
  }, [serverTimezone])

  return null
}
