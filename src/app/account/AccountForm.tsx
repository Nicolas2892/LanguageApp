'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Volume2, VolumeX } from 'lucide-react'
import { useSpeech } from '@/lib/hooks/useSpeech'
import type { Profile } from '@/lib/supabase/types'

const LEVELS = ['A2', 'B1', 'B2'] as const
const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A2: 'Foundation',
  B1: 'Intermediate',
  B2: 'Advanced',
}

interface Props {
  profile: Profile
}

export function AccountForm({ profile }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [level, setLevel] = useState(profile.current_level)
  const [goalMinutes, setGoalMinutes] = useState(String(profile.daily_goal_minutes))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { enabled: audioEnabled, toggle: toggleAudio } = useSpeech()

  async function handleSave() {
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
          current_level: level,
          daily_goal_minutes: goalNum,
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

  return (
    <div className="space-y-6">
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
      </div>

      {/* Level picker — card style */}
      <div className="space-y-1.5">
        <Label>Current level</Label>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => { setLevel(l); setSaved(false) }}
              className={`rounded-xl border p-3 text-left transition-colors ${
                level === l
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-muted/30'
              }`}
            >
              <p className="font-bold text-base">{l}</p>
              <p className="text-xs mt-0.5 font-normal text-current opacity-70">{LEVEL_DESCRIPTIONS[l]}</p>
            </button>
          ))}
        </div>
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

      {/* Audio playback toggle */}
      <div className="space-y-1.5">
        <Label>Audio playback</Label>
        <button
          type="button"
          onClick={toggleAudio}
          className={`w-full rounded-xl border p-3 flex items-center gap-3 text-left transition-colors ${
            audioEnabled === false
              ? 'border-gray-200 hover:border-gray-300'
              : 'border-orange-500 bg-orange-50'
          }`}
        >
          {audioEnabled === false ? (
            <VolumeX className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Volume2 className="h-4 w-4 shrink-0 text-orange-600" />
          )}
          <div>
            <p className={`text-sm font-medium ${audioEnabled === false ? '' : 'text-orange-700'}`}>
              {audioEnabled === false ? 'Audio off' : 'Audio on'}
            </p>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              Speak Spanish sentences aloud in exercises and curriculum
            </p>
          </div>
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-sm text-red-600 border border-red-200 rounded-lg p-3">{error}</p>
      )}
      {saved && (
        <p className="text-sm text-green-700 border border-green-200 rounded-lg p-3">Changes saved.</p>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-full active:scale-95 transition-transform">
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
