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
  trackOnboardingStarted,
  trackSessionStarted,
  trackHintRequested,
  trackExerciseGenerated,
  trackHardFlagToggled,
  trackOfflineModuleDownloaded,
  trackOfflineSyncCompleted,
  trackFeatureFirstUse,
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
    it('calls posthog.identify with typed traits', () => {
      identifyUser('user-123', { computed_level: 'B2', streak: 5, mastered_count: 10 })
      expect(mockIdentify).toHaveBeenCalledWith('user-123', { computed_level: 'B2', streak: 5, mastered_count: 10 })
    })
  })

  describe('resetAnalytics', () => {
    it('calls posthog.reset', () => {
      resetAnalytics()
      expect(mockReset).toHaveBeenCalled()
    })
  })

  describe('trackOnboardingStarted', () => {
    it('captures onboarding_started', () => {
      trackOnboardingStarted()
      expect(mockCapture).toHaveBeenCalledWith('onboarding_started')
    })
  })

  describe('trackSessionStarted', () => {
    it('captures session_started with props', () => {
      const props = { practiceMode: true, mode: 'sprint', conceptId: 'c1' }
      trackSessionStarted(props)
      expect(mockCapture).toHaveBeenCalledWith('session_started', props)
    })
  })

  describe('trackHintRequested', () => {
    it('captures hint_requested with props', () => {
      const props = { exerciseType: 'gap_fill', conceptId: 'c1', wrongAttempts: 2 }
      trackHintRequested(props)
      expect(mockCapture).toHaveBeenCalledWith('hint_requested', props)
    })
  })

  describe('trackExerciseGenerated', () => {
    it('captures exercise_generated', () => {
      trackExerciseGenerated({ conceptId: 'c1', exerciseType: 'translation' })
      expect(mockCapture).toHaveBeenCalledWith('exercise_generated', { conceptId: 'c1', exerciseType: 'translation' })
    })
  })

  describe('trackHardFlagToggled', () => {
    it('captures hard_flag_toggled', () => {
      trackHardFlagToggled({ conceptId: 'c1', isHard: true })
      expect(mockCapture).toHaveBeenCalledWith('hard_flag_toggled', { conceptId: 'c1', isHard: true })
    })
  })

  describe('trackOfflineModuleDownloaded', () => {
    it('captures offline_module_downloaded', () => {
      const props = { moduleId: 'm1', exerciseCount: 10, conceptCount: 5 }
      trackOfflineModuleDownloaded(props)
      expect(mockCapture).toHaveBeenCalledWith('offline_module_downloaded', props)
    })
  })

  describe('trackOfflineSyncCompleted', () => {
    it('captures offline_sync_completed', () => {
      trackOfflineSyncCompleted({ grammarCount: 3, verbCount: 2, reportId: 'r1' })
      expect(mockCapture).toHaveBeenCalledWith('offline_sync_completed', { grammarCount: 3, verbCount: 2, reportId: 'r1' })
    })
  })

  describe('trackFeatureFirstUse', () => {
    it('captures feature_first_use and stores in localStorage', () => {
      const mockStorage = new Map<string, string>()
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => mockStorage.get(key) ?? null,
        setItem: (key: string, value: string) => mockStorage.set(key, value),
      })
      trackFeatureFirstUse('tutor')
      expect(mockCapture).toHaveBeenCalledWith('feature_first_use', { feature: 'tutor' })
      expect(mockStorage.get('posthog_first_use_tutor')).toBe('1')
      vi.unstubAllGlobals()
    })

    it('does not fire twice for same feature', () => {
      const mockStorage = new Map<string, string>()
      mockStorage.set('posthog_first_use_tutor', '1')
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => mockStorage.get(key) ?? null,
        setItem: (key: string, value: string) => mockStorage.set(key, value),
      })
      trackFeatureFirstUse('tutor')
      expect(mockCapture).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })
  })
})
