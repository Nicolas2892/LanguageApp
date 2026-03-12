'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, CheckCircle2 } from 'lucide-react'
import { useSpeech } from '@/lib/hooks/useSpeech'
import { useTheme } from '@/components/ThemeProvider'
import { LEVEL_CHIP } from '@/lib/constants'
import type { Profile } from '@/lib/supabase/types'

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

  const computedLevel = (profile.computed_level ?? 'B1') as keyof typeof LEVEL_CHIP
  const levelChip = LEVEL_CHIP[computedLevel]

  async function handleSave(extraFields?: Record<string, unknown>) {
    setSaving(true)
    setSaved(false)
    setError(null)

    const goalNum = parseInt(goalMinutes, 10)
    if (isNaN(goalNum) || goalNum < 5 || goalNum > 120) {
      setError('La meta diaria debe estar entre 5 y 120 minutos.')
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
        throw new Error(data.error ?? 'Error al guardar')
      }
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.')
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
      <div style={{ padding: '0.25rem 0 1rem' }}>
        <span className="senda-eyebrow block mb-3">Perfil</span>

        <div className="flex flex-col gap-1 mb-4">
          <label htmlFor="display_name" className="senda-field-label">Nombre</label>
          <input
            id="display_name"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }}
            maxLength={50}
            placeholder="Tu nombre"
            className="senda-input"
          />
          {displayName.length >= 35 && (
            <p className="text-xs text-right" style={{ color: 'var(--d5-muted)' }}>{displayName.length}/50</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="daily_goal" className="senda-field-label">Meta diaria</label>
          <input
            id="daily_goal"
            type="number"
            min={5}
            max={120}
            value={goalMinutes}
            onChange={(e) => { setGoalMinutes(e.target.value); setSaved(false) }}
            className="senda-input"
          />
        </div>
      </div>

      <div style={{ height: '1.5rem' }} />

      {/* ── Section 2: Apariencia ── */}
      <div style={{ padding: '0.25rem 0 1rem' }}>
        <span className="senda-eyebrow block mb-3">Apariencia</span>

        <div className="flex gap-2" style={{ marginBottom: '1rem' }}>
          {THEME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleThemeChange(value)}
              aria-pressed={theme === value}
              className={`senda-focus-ring rounded-full px-3.5 border-none cursor-pointer transition-[background,color] duration-200 ease-out ${
                theme === value
                  ? 'bg-[rgba(140,106,63,0.12)] text-[var(--d5-ink)] font-bold dark:bg-[rgba(184,170,153,0.18)] dark:text-[var(--d5-paper)]'
                  : 'bg-[rgba(140,106,63,0.04)] text-[var(--d5-muted)] dark:bg-[rgba(184,170,153,0.06)]'
              }`}
              style={{
                fontSize: '0.75rem',
                minHeight: '2.75rem',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleAudio}
          className={`senda-focus-ring w-full rounded-xl flex items-center gap-3 text-left border-none cursor-pointer transition-[background] duration-200 ease-out ${
            audioEnabled === false
              ? 'bg-[rgba(140,106,63,0.04)] dark:bg-[rgba(184,170,153,0.06)]'
              : 'bg-[rgba(196,82,46,0.05)] dark:bg-[rgba(196,82,46,0.10)]'
          }`}
          style={{
            padding: '0.75rem',
            boxShadow: '0 10px 30px -10px rgba(26,17,8,0.06)',
          }}
        >
          {audioEnabled === false ? (
            <VolumeX size={16} strokeWidth={1.5} className="shrink-0 opacity-40" style={{ color: 'var(--d5-ink)' }} />
          ) : (
            <Volume2 size={16} strokeWidth={1.5} className="shrink-0" style={{ color: 'var(--d5-terracotta)' }} />
          )}
          <div>
            <p className={`text-sm font-medium ${audioEnabled === false ? 'text-[var(--d5-muted)]' : 'text-[var(--d5-ink)] dark:text-[var(--d5-paper)]'}`}>
              {audioEnabled === false ? 'Audio desactivado' : 'Audio activado'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--d5-muted)' }}>
              Reproducir frases en español en los ejercicios y el currículo
            </p>
          </div>
        </button>
      </div>

      <div style={{ height: '1.5rem' }} />

      {/* ── Section 3: Nivel actual ── */}
      <div className="flex items-center justify-between" style={{ padding: '0.25rem 0 1rem' }}>
        <span className="senda-field-label">Nivel actual</span>
        {levelChip ? (
          <span className={levelChip.className} style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.125rem 0.625rem',
            borderRadius: 9999,
          }}>
            {computedLevel}
          </span>
        ) : (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.125rem 0.625rem',
            borderRadius: 9999,
            background: 'rgba(245,158,11,0.12)',
            color: 'var(--d5-ink)',
          }}>
            {computedLevel}
          </span>
        )}
      </div>

      {/* ── Section 4: Guardar ── */}
      <div style={{ padding: '0.25rem 0 0' }}>
        {error && (
          <p style={{ fontSize: '0.75rem', color: 'var(--d5-error)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--d5-error-surface)', marginBottom: '1rem' }}>{error}</p>
        )}
        {saved && (
          <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--d5-terracotta)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(196,82,46,0.06)', marginBottom: '1rem' }}>
            <CheckCircle2 size={14} strokeWidth={1.5} className="shrink-0" />
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
