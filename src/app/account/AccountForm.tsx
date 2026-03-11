'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, CheckCircle2 } from 'lucide-react'
import { useSpeech } from '@/lib/hooks/useSpeech'
import { useTheme } from '@/components/ThemeProvider'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import type { Profile } from '@/lib/supabase/types'

type ThemeValue = 'light' | 'dark' | 'system'

const THEME_OPTIONS: { value: ThemeValue; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
]

const eyebrowStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--d5-muted)',
  display: 'block',
  marginBottom: 14,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: 'rgba(26,17,8,0.5)',
}

const bareInputStyle: React.CSSProperties = {
  background: 'rgba(26,17,8,0.04)',
  border: '1px solid rgba(26,17,8,0.08)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--d5-ink)',
  padding: '8px 12px',
  outline: 'none',
  width: '100%',
}

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
    <div>
      {/* ── Section 1: Perfil ── */}
      <div style={{ padding: '4px 0 16px' }}>
        <span style={eyebrowStyle}>Perfil</span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18 }}>
          <label htmlFor="display_name" style={fieldLabelStyle}>Nombre</label>
          <input
            id="display_name"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }}
            maxLength={50}
            placeholder="Tu nombre"
            style={bareInputStyle}
          />
          {displayName.length >= 35 && (
            <p style={{ fontSize: 11, color: 'var(--d5-muted)', textAlign: 'right' }}>{displayName.length}/50</p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="daily_goal" style={fieldLabelStyle}>Meta diaria</label>
          <input
            id="daily_goal"
            type="number"
            min={5}
            max={120}
            value={goalMinutes}
            onChange={(e) => { setGoalMinutes(e.target.value); setSaved(false) }}
            style={bareInputStyle}
          />
        </div>
      </div>

      <WindingPathSeparator />

      {/* ── Section 2: Apariencia ── */}
      <div style={{ padding: '4px 0 16px' }}>
        <span style={eyebrowStyle}>Apariencia</span>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {THEME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleThemeChange(value)}
              aria-pressed={theme === value}
              style={{
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 10,
                fontWeight: theme === value ? 700 : 400,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 150ms, color 150ms',
                background: theme === value ? 'rgba(26,17,8,0.08)' : 'rgba(26,17,8,0.03)',
                color: theme === value ? 'var(--d5-ink)' : 'rgba(26,17,8,0.45)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleAudio}
          style={{
            width: '100%',
            borderRadius: 12,
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textAlign: 'left',
            background: audioEnabled === false ? 'rgba(26,17,8,0.03)' : 'rgba(196,82,46,0.05)',
            boxShadow: '0 10px 30px -10px rgba(26,17,8,0.06)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
        >
          {audioEnabled === false ? (
            <VolumeX size={16} strokeWidth={1.5} style={{ color: 'var(--d5-ink)', flexShrink: 0, opacity: 0.4 }} />
          ) : (
            <Volume2 size={16} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)', flexShrink: 0 }} />
          )}
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: audioEnabled === false ? 'var(--d5-muted)' : 'var(--d5-ink)' }}>
              {audioEnabled === false ? 'Audio desactivado' : 'Audio activado'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--d5-muted)', marginTop: 2 }}>
              Reproducir frases en español en los ejercicios y el currículo
            </p>
          </div>
        </button>
      </div>

      <WindingPathSeparator />

      {/* ── Section 3: Nivel actual ── */}
      <div style={{ padding: '4px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--d5-warm)' }}>Nivel actual</span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 10px',
          borderRadius: 9999,
          background: 'rgba(245,158,11,0.12)',
          color: '#92400e',
        }}>
          {computedLevel}
        </span>
      </div>

      {/* ── Section 4: Guardar ── */}
      <div style={{ padding: '4px 0 0' }}>
        {error && (
          <p style={{ fontSize: 12, color: '#dc2626', padding: '8px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', marginBottom: 16 }}>{error}</p>
        )}
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--d5-terracotta)', padding: '8px 12px', borderRadius: 8, background: 'rgba(196,82,46,0.06)', marginBottom: 16 }}>
            <CheckCircle2 size={14} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <span>Cambios guardados.</span>
          </div>
        )}
        <Button onClick={() => handleSave()} disabled={saving} className="w-full rounded-full active:scale-95 transition-transform">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
