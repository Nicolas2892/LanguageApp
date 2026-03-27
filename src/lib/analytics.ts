import posthog from 'posthog-js'
import { storage } from '@/lib/platform/storage'

// ── Initialisation (called once from PostHogProvider) ────────────────────────

let initialised = false

export function initAnalytics() {
  if (initialised) return
  if (typeof window === 'undefined') return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (!key) return

  posthog.init(key, {
    api_host: host || 'https://us.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    autocapture: false,
  })

  initialised = true
}

// ── Identity ─────────────────────────────────────────────────────────────────

export interface UserTraits {
  computed_level?: string | null
  streak?: number
  timezone?: string | null
  streak_freeze_remaining?: number
  mastered_count?: number
  days_since_signup?: number
}

export function identifyUser(userId: string, traits?: UserTraits) {
  if (typeof window === 'undefined') return
  posthog.identify(userId, traits)
}

export function resetAnalytics() {
  if (typeof window === 'undefined') return
  posthog.reset()
}

// ── Auth events ──────────────────────────────────────────────────────────────

export function trackSignup() {
  if (typeof window === 'undefined') return
  posthog.capture('signup')
}

export function trackLogin() {
  if (typeof window === 'undefined') return
  posthog.capture('login')
}

// ── Onboarding ───────────────────────────────────────────────────────────────

export function trackOnboardingComplete(level: string) {
  if (typeof window === 'undefined') return
  posthog.capture('onboarding_complete', { level })
}

// ── Study exercises ──────────────────────────────────────────────────────────

export function trackExerciseSubmitted(props: {
  exerciseType: string
  conceptId: string
  score: number
  isCorrect: boolean
  practiceMode: boolean
}) {
  if (typeof window === 'undefined') return
  posthog.capture('exercise_submitted', props)
}

export function trackSessionCompleted(props: {
  correct: number
  total: number
  practiceMode: boolean
  elapsedSeconds?: number
}) {
  if (typeof window === 'undefined') return
  posthog.capture('session_completed', props)
}

// ── Verb drills ──────────────────────────────────────────────────────────────

export function trackVerbDrillStarted(props: {
  tenses: string[]
  verbSet: string
  length: number
}) {
  if (typeof window === 'undefined') return
  posthog.capture('verb_drill_started', props)
}

export function trackVerbDrillCompleted(props: {
  correct: number
  total: number
}) {
  if (typeof window === 'undefined') return
  posthog.capture('verb_drill_completed', props)
}

// ── Tutor ────────────────────────────────────────────────────────────────────

export function trackTutorMessageSent(conceptId?: string) {
  if (typeof window === 'undefined') return
  posthog.capture('tutor_message_sent', { conceptId })
}

// ── Free write ───────────────────────────────────────────────────────────────

export function trackFreeWriteSubmitted(conceptId: string) {
  if (typeof window === 'undefined') return
  posthog.capture('free_write_submitted', { conceptId })
}

// ── Vocab drills ──────────────────────────────────────────────────────────────

export function trackVocabDrillStarted(props: {
  categories: string[]
  length: number
}) {
  if (typeof window === 'undefined') return
  posthog.capture('vocab_drill_started', props)
}

export function trackVocabDrillCompleted(props: {
  correct: number
  total: number
}) {
  if (typeof window === 'undefined') return
  posthog.capture('vocab_drill_completed', props)
}

// ── Streak ───────────────────────────────────────────────────────────────────

export function trackStreakMilestone(streak: number) {
  if (typeof window === 'undefined') return
  posthog.capture('streak_milestone', { streak })
}

// ── Onboarding ──────────────────────────────────────────────────────────────

export function trackOnboardingStarted() {
  if (typeof window === 'undefined') return
  posthog.capture('onboarding_started')
}

// ── Session lifecycle ───────────────────────────────────────────────────────

export function trackSessionStarted(props: {
  practiceMode: boolean
  mode?: string
  conceptId?: string
  unitId?: string
  moduleId?: string
  exerciseTypes?: string[]
}) {
  if (typeof window === 'undefined') return
  posthog.capture('session_started', props)
}

// ── Hints ───────────────────────────────────────────────────────────────────

export function trackHintRequested(props: {
  exerciseType: string
  conceptId: string
  wrongAttempts: number
}) {
  if (typeof window === 'undefined') return
  posthog.capture('hint_requested', props)
}

// ── Exercise generation ─────────────────────────────────────────────────────

export function trackExerciseGenerated(props: {
  conceptId: string
  exerciseType: string
}) {
  if (typeof window === 'undefined') return
  posthog.capture('exercise_generated', props)
}

// ── Hard flag ───────────────────────────────────────────────────────────────

export function trackHardFlagToggled(props: {
  conceptId: string
  isHard: boolean
}) {
  if (typeof window === 'undefined') return
  posthog.capture('hard_flag_toggled', props)
}

// ── Offline ─────────────────────────────────────────────────────────────────

export function trackOfflineModuleDownloaded(props: {
  moduleId: string
  exerciseCount: number
  conceptCount: number
}) {
  if (typeof window === 'undefined') return
  posthog.capture('offline_module_downloaded', props)
}

export function trackOfflineDownloadAll(props: {
  totalModules: number
  downloadedModules: number
  skippedModules: number
  failedModules: number
  durationMs: number
}) {
  if (typeof window === 'undefined') return
  posthog.capture('offline_download_all', props)
}

export function trackOfflineSyncCompleted(props: {
  grammarCount: number
  verbCount: number
  reportId?: string
}) {
  if (typeof window === 'undefined') return
  posthog.capture('offline_sync_completed', props)
}

// ── Feature discovery ───────────────────────────────────────────────────────

export function trackFeatureFirstUse(feature: string) {
  if (typeof window === 'undefined') return
  const key = `posthog_first_use_${feature}`
  if (storage.get(key)) return
  posthog.capture('feature_first_use', { feature })
  storage.set(key, '1')
}
