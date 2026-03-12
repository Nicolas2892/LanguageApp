import posthog from 'posthog-js'

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

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
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

// ── Streak ───────────────────────────────────────────────────────────────────

export function trackStreakMilestone(streak: number) {
  if (typeof window === 'undefined') return
  posthog.capture('streak_milestone', { streak })
}
