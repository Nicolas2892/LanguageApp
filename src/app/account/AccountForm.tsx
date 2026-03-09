'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Volume2, VolumeX, UserCircle, Settings2, CheckCircle2, GraduationCap, Sun, Moon, Monitor } from 'lucide-react'
import { useSpeech } from '@/lib/hooks/useSpeech'
import { useTheme } from '@/components/ThemeProvider'
import type { Profile } from '@/lib/supabase/types'

const LEVEL_LABELS: Record<string, string> = {
  B1: 'Intermediate',
  B2: 'Advanced',
  C1: 'Proficient',
}

type ThemeValue = 'light' | 'dark' | 'system'

const THEME_OPTIONS: { value: ThemeValue; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

interface MasteryBreakdown {
  masteredByLevel: Record<string, number>
  totalByLevel: Record<string, number>
}

interface Props {
  profile: Profile
  mastery: MasteryBreakdown
}

export function AccountForm({ profile, mastery }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [goalMinutes, setGoalMinutes] = useState(String(profile.daily_goal_minutes))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { enabled: audioEnabled, toggle: toggleAudio } = useSpeech()
  const { theme, setTheme } = useTheme()

  const computedLevel = profile.computed_level ?? 'B1'

  async function handleSave(extraFields?: Record<string, unknown>) {
    setSaving(true)
    setSaved(false)
    setError(null)

    const goalNum = parseInt(goalMinutes, 10)
    if (isNaN(goalNum) || goalNum < 5 || goalNum > 120) {
      setError('Daily goal must be between 5 and 120 minutes.')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || undefined,
          daily_goal_minutes: goalNum,
          ...extraFields,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to save')
      }
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleThemeChange(next: ThemeValue) {
    setTheme(next)
    try {
      await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_preference: next }),
      })
    } catch {
      // silently fail — theme is applied locally regardless
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <UserCircle className="h-3.5 w-3.5" />
        Profile
      </h2>

      {/* Display name */}
      <div className="space-y-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }}
          maxLength={50}
          placeholder="Your name"
        />
        {displayName.length >= 35 && (
          <p className="text-xs text-muted-foreground text-right">{displayName.length}/50</p>
        )}
      </div>

      {/* Computed level — read-only */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" />
          Your level
        </Label>
        <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-green-800 dark:text-green-300">{computedLevel}</span>
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">{LEVEL_LABELS[computedLevel] ?? computedLevel}</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {(['B1', 'B2', 'C1'] as const).map((lvl) => {
              const total = mastery.totalByLevel[lvl] ?? 0
              const mastered = mastery.masteredByLevel[lvl] ?? 0
              if (total === 0) return null
              return (
                <p key={lvl}>
                  <span className="font-medium text-foreground">{lvl}</span>: {mastered} of {total} mastered
                </p>
              )
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Computed from SRS progress + production exercises. Updates after each session.
        </p>
      </div>

      {/* Daily goal */}
      <div className="space-y-1.5">
        <Label htmlFor="daily_goal">Daily goal (minutes)</Label>
        <Input
          id="daily_goal"
          type="number"
          min={5}
          max={120}
          value={goalMinutes}
          onChange={(e) => { setGoalMinutes(e.target.value); setSaved(false) }}
        />
        <p className="text-xs text-muted-foreground">Between 5 and 120 minutes.</p>
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-3">{error}</p>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Changes saved.</span>
        </div>
      )}

      <Button onClick={() => handleSave()} disabled={saving} className="w-full rounded-full active:scale-95 transition-transform">
        {saving ? 'Saving…' : 'Save changes'}
      </Button>

      <h2 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">
        <Settings2 className="h-3.5 w-3.5" />
        Preferences
      </h2>

      {/* Theme toggle */}
      <div className="space-y-2">
        <p className="text-sm font-medium leading-none">Theme</p>
        <div className="flex rounded-xl border border-border overflow-hidden">
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleThemeChange(value)}
              aria-pressed={theme === value}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors duration-150 ${
                theme === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Audio playback toggle */}
      <button
        type="button"
        onClick={toggleAudio}
        className={`w-full rounded-xl border p-3 flex items-center gap-3 text-left transition-colors ${
          audioEnabled === false
            ? 'border-gray-200 hover:border-gray-300'
            : 'border-green-700 bg-green-50 dark:bg-green-950/30'
        }`}
      >
        {audioEnabled === false ? (
          <VolumeX className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <Volume2 className="h-4 w-4 shrink-0 text-green-700 dark:text-green-400" />
        )}
        <div>
          <p className={`text-sm font-medium ${audioEnabled === false ? '' : 'text-green-800 dark:text-green-300'}`}>
            {audioEnabled === false ? 'Audio off' : 'Audio on'}
          </p>
          <p className="text-xs font-normal text-muted-foreground mt-0.5">
            Speak Spanish sentences aloud in exercises and curriculum
          </p>
        </div>
      </button>
    </div>
  )
}
