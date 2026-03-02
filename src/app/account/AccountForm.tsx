'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/lib/supabase/types'

const LEVELS = ['A2', 'B1', 'B2'] as const

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

      {/* Level */}
      <div className="space-y-1.5">
        <Label>Current level</Label>
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => { setLevel(l); setSaved(false) }}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                level === l
                  ? 'border-foreground bg-foreground text-background'
                  : 'hover:bg-muted/40'
              }`}
            >
              {l}
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

      {/* Feedback */}
      {error && (
        <p className="text-sm text-red-600 border border-red-200 rounded-lg p-3">{error}</p>
      )}
      {saved && (
        <p className="text-sm text-green-700 border border-green-200 rounded-lg p-3">Changes saved.</p>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
