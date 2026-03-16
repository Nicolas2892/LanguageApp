'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getUnsyncedAttempts,
  markAttemptsSynced,
  getUnsyncedVerbAttempts,
  markVerbAttemptsSynced,
} from './db'
import { useNetworkStatus } from './useNetworkStatus'

export type SyncState = 'idle' | 'syncing' | 'done' | 'error'

interface SyncResult {
  reportId?: string
  grammarCount: number
  verbCount: number
}

export function useSyncManager() {
  const { isOnline } = useNetworkStatus()
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)
  const syncingRef = useRef(false)

  const sync = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncState('syncing')
    setSyncProgress(0)
    setSyncResult(null)

    let reportId: string | undefined
    let grammarCount = 0
    let verbCount = 0

    try {
      // 1. Sync grammar attempts
      const unsyncedAttempts = await getUnsyncedAttempts()
      if (unsyncedAttempts.length > 0) {
        setSyncProgress(20)

        // Group by session
        const bySession = new Map<string, typeof unsyncedAttempts>()
        for (const a of unsyncedAttempts) {
          const arr = bySession.get(a.session_id) ?? []
          arr.push(a)
          bySession.set(a.session_id, arr)
        }

        for (const [sessionId, attempts] of bySession) {
          const res = await fetch('/api/offline/grade-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              attempts: attempts.map(a => ({
                exercise_id: a.exercise_id,
                concept_id: a.concept_id,
                concept_title: a.concept_title,
                user_answer: a.user_answer,
                exercise_type: a.exercise_type,
                exercise_prompt: a.exercise_prompt,
                expected_answer: a.expected_answer,
                answer_variants: a.answer_variants,
                attempted_at: a.attempted_at,
              })),
            }),
          })

          if (res.ok) {
            const data = await res.json() as { report_id?: string }
            reportId = data.report_id
            const ids = attempts.map(a => a.id!).filter(Boolean)
            await markAttemptsSynced(ids)
            grammarCount += attempts.length
          }
        }
      }

      setSyncProgress(60)

      // 2. Sync verb attempts
      const unsyncedVerbs = await getUnsyncedVerbAttempts()
      if (unsyncedVerbs.length > 0) {
        const res = await fetch('/api/offline/verb-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempts: unsyncedVerbs.map(a => ({
              verb_id: a.verb_id,
              tense: a.tense,
              correct: a.correct,
              attempted_at: a.attempted_at,
            })),
          }),
        })

        if (res.ok) {
          const ids = unsyncedVerbs.map(a => a.id!).filter(Boolean)
          await markVerbAttemptsSynced(ids)
          verbCount = unsyncedVerbs.length
        }
      }

      setSyncProgress(100)
      setSyncResult({ reportId, grammarCount, verbCount })
      setSyncState('done')

      // Auto-dismiss after 5s
      setTimeout(() => {
        setSyncState('idle')
        setSyncResult(null)
      }, 5000)
    } catch {
      setSyncState('error')
    } finally {
      syncingRef.current = false
    }
  }, [])

  // Trigger sync when coming back online
  useEffect(() => {
    if (!isOnline) return

    // Small delay to ensure network is stable
    const timer = setTimeout(() => {
      sync()
    }, 2000)

    return () => clearTimeout(timer)
  }, [isOnline, sync])

  // Listen for service worker sync message
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'SYNC_TRIGGERED') {
        sync()
      }
    }
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage)
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [sync])

  return {
    syncState,
    syncResult,
    syncProgress,
    sync,
  }
}
