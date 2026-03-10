'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, CheckCircle2 } from 'lucide-react'
import { useSpeech } from '@/lib/hooks/useSpeech'
import { useTheme } from '@/components/ThemeProvider'
import type { Profile } from '@/lib/supabase/types'

const LEVEL_LABELS: Record<string, string> = {
  B1: 'Intermediate',
  B2: 'Advanced',
  C1: 'Proficient',
}

type ThemeValue = 'light' | 'dark' | 'system'

const THEME_OPTIONS: { value: ThemeValue; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
]

interface Props {
  profile: Profile
}

export function AccountForm({ profile }: Props) {
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
      <span className="senda-eyebrow">Perfil</span>

      {/* Display name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label
          htmlFor="display_name"
          style={{ fontSize: 10, fontWeight: 600, color: 'var(--d5-warm)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          Nombre
        </label>
        <input
          id="display_name"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }}
          maxLength={50}
          placeholder="Tu nombre"
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(184,170,153,0.4)',
            borderRadius: 0,
            fontSize: 13,
            color: 'var(--d5-ink)',
            padding: '4px 0',
            outline: 'none',
            width: '100%',
          }}
        />
        {displayName.length >= 35 && (
          <p className="text-xs text-muted-foreground text-right">{displayName.length}/50</p>
        )}
      </div>

      {/* Computed level — read-only */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--d5-warm)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Nivel actual
        </span>
        <span style={{
          background: 'rgba(251,191,36,0.15)',
          color: '#78350f',
          borderRadius: 9999,
          padding: '2px 10px',
          fontSize: 12,
          fontWeight: 700,
        }}>
          {computedLevel} · {LEVEL_LABELS[computedLevel] ?? computedLevel}
        </span>
      </div>

      {/* Daily goal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label
          htmlFor="daily_goal"
          style={{ fontSize: 10, fontWeight: 600, color: 'var(--d5-warm)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          Meta diaria (minutos)
        </label>
        <input
          id="daily_goal"
          type="number"
          min={5}
          max={120}
          value={goalMinutes}
          onChange={(e) => { setGoalMinutes(e.target.value); setSaved(false) }}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(184,170,153,0.4)',
            borderRadius: 0,
            fontSize: 13,
            color: 'var(--d5-ink)',
            padding: '4px 0',
            outline: 'none',
            width: '100%',
          }}
        />
        <p className="text-xs text-muted-foreground">Entre 5 y 120 minutos.</p>
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-3">{error}</p>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-sm border rounded-lg p-3" style={{ color: 'var(--d5-terracotta)', borderColor: 'rgba(196,82,46,0.30)' }}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Cambios guardados.</span>
        </div>
      )}

      <Button onClick={() => handleSave()} disabled={saving} className="w-full rounded-full active:scale-95 transition-transform">
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </Button>

      <span className="senda-eyebrow block pt-2">Apariencia</span>

      {/* Theme toggle */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleThemeChange(value)}
              aria-pressed={theme === value}
              style={{
                flex: 1,
                borderRadius: 9999,
                padding: '6px 0',
                fontSize: 12,
                fontWeight: theme === value ? 700 : 400,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 150ms, color 150ms',
                background: theme === value ? 'rgba(26,17,8,0.08)' : 'rgba(26,17,8,0.03)',
                color: theme === value ? 'var(--d5-ink)' : 'rgba(26,17,8,0.40)',
              }}
            >
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
            : 'border-primary bg-primary/5'
        }`}
      >
        {audioEnabled === false ? (
          <VolumeX className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <Volume2 className="h-4 w-4 shrink-0 text-primary" />
        )}
        <div>
          <p className={`text-sm font-medium ${audioEnabled === false ? '' : 'text-primary'}`}>
            {audioEnabled === false ? 'Audio desactivado' : 'Audio activado'}
          </p>
          <p className="text-xs font-normal text-muted-foreground mt-0.5">
            Reproducir frases en español en los ejercicios y el currículo
          </p>
        </div>
      </button>
    </div>
  )
}
