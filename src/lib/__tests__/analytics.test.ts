import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCapture, mockIdentify, mockReset, mockInit } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockIdentify: vi.fn(),
  mockReset: vi.fn(),
  mockInit: vi.fn(),
}))

vi.mock('posthog-js', () => ({
  default: {
    init: mockInit,
    capture: mockCapture,
    identify: mockIdentify,
    reset: mockReset,
  },
}))

import {
  initAnalytics,
  identifyUser,
  resetAnalytics,
  trackSignup,
  trackLogin,
  trackOnboardingComplete,
  trackExerciseSubmitted,
  trackSessionCompleted,
  trackVerbDrillStarted,
  trackVerbDrillCompleted,
  trackTutorMessageSent,
  trackFreeWriteSubmitted,
  trackStreakMilestone,
} from '../analytics'

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initAnalytics', () => {
    it('does not call posthog.init when NEXT_PUBLIC_POSTHOG_KEY is missing', () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY
      initAnalytics()
      expect(mockInit).not.toHaveBeenCalled()
    })
  })

  describe('trackSignup', () => {
    it('calls posthog.capture with "signup"', () => {
      trackSignup()
      expect(mockCapture).toHaveBeenCalledWith('signup')
    })
  })

  describe('trackLogin', () => {
    it('calls posthog.capture with "login"', () => {
      trackLogin()
      expect(mockCapture).toHaveBeenCalledWith('login')
    })
  })

  describe('trackOnboardingComplete', () => {
    it('captures with level', () => {
      trackOnboardingComplete('B1')
      expect(mockCapture).toHaveBeenCalledWith('onboarding_complete', { level: 'B1' })
    })
  })

  describe('trackExerciseSubmitted', () => {
    it('captures exercise details', () => {
      const props = {
        exerciseType: 'gap_fill',
        conceptId: 'c1',
        score: 3,
        isCorrect: true,
        practiceMode: false,
      }
      trackExerciseSubmitted(props)
      expect(mockCapture).toHaveBeenCalledWith('exercise_submitted', props)
    })
  })

  describe('trackSessionCompleted', () => {
    it('captures session summary', () => {
      const props = { correct: 8, total: 10, practiceMode: true, elapsedSeconds: 120 }
      trackSessionCompleted(props)
      expect(mockCapture).toHaveBeenCalledWith('session_completed', props)
    })
  })

  describe('trackVerbDrillStarted', () => {
    it('captures drill config', () => {
      const props = { tenses: ['presente'], verbSet: 'top25', length: 10 }
      trackVerbDrillStarted(props)
      expect(mockCapture).toHaveBeenCalledWith('verb_drill_started', props)
    })
  })

  describe('trackVerbDrillCompleted', () => {
    it('captures drill results', () => {
      trackVerbDrillCompleted({ correct: 7, total: 10 })
      expect(mockCapture).toHaveBeenCalledWith('verb_drill_completed', { correct: 7, total: 10 })
    })
  })

  describe('trackTutorMessageSent', () => {
    it('captures with optional conceptId', () => {
      trackTutorMessageSent('c1')
      expect(mockCapture).toHaveBeenCalledWith('tutor_message_sent', { conceptId: 'c1' })
    })
  })

  describe('trackFreeWriteSubmitted', () => {
    it('captures conceptId', () => {
      trackFreeWriteSubmitted('c1')
      expect(mockCapture).toHaveBeenCalledWith('free_write_submitted', { conceptId: 'c1' })
    })
  })

  describe('trackStreakMilestone', () => {
    it('captures streak number', () => {
      trackStreakMilestone(7)
      expect(mockCapture).toHaveBeenCalledWith('streak_milestone', { streak: 7 })
    })
  })

  describe('identifyUser', () => {
    it('calls posthog.identify', () => {
      identifyUser('user-123', { level: 'B2' })
      expect(mockIdentify).toHaveBeenCalledWith('user-123', { level: 'B2' })
    })
  })

  describe('resetAnalytics', () => {
    it('calls posthog.reset', () => {
      resetAnalytics()
      expect(mockReset).toHaveBeenCalled()
    })
  })
})
