'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'

const EXERCISE_TYPES = [
  { value: 'gap_fill',         label: 'Completar'      },
  { value: 'transformation',   label: 'Transformación' },
  { value: 'translation',      label: 'Traducción'     },
  { value: 'error_correction', label: 'Errores'        },
  { value: 'sentence_builder', label: 'Constructor'    },
  { value: 'free_write',       label: 'Escritura'      },
]

const SESSION_SIZES = [5, 10, 15, 20, 25] as const
const DEFAULT_SIZE = 10

// Shared eyebrow style — uses adaptive --d5-eyebrow token
const EYEBROW: React.CSSProperties = {
  fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--d5-eyebrow)',
  marginBottom: '0.5rem',
  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
}

type SessionMode = 'srs' | 'review' | 'practice'

interface Module {
  id: string
  title: string
  mastered: number
  total: number
}

interface Props {
  modules: Module[]
  mistakeConceptCount: number
  dueCount: number
}

export function SessionConfig({ modules, mistakeConceptCount, dueCount }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode: SessionMode = searchParams.get('mode') === 'practice' ? 'practice' : 'srs'
  const [sessionMode, setSessionMode] = useState<SessionMode>(initialMode)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [sessionSize, setSessionSize] = useState(DEFAULT_SIZE)

  function toggleModule(id: string) {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    )
  }

  function handleStart() {
    if (sessionMode === 'review') {
      router.push('/study?mode=review')
      return
    }
    const params = new URLSearchParams()
    if (sessionMode === 'practice') params.set('practice', 'true')
    if (selectedModules.length > 0) params.set('module', selectedModules.join(','))
    if (selectedTypes.length > 0) params.set('types', selectedTypes.join(','))
    if (sessionSize !== DEFAULT_SIZE) params.set('size', String(sessionSize))
    router.push(`/study?${params.toString()}`)
  }

  const modes: Array<{ id: SessionMode; title: string; subtitle: string }> = [
    { id: 'srs',      title: 'Repaso Diario',    subtitle: `${dueCount} concepto${dueCount !== 1 ? 's' : ''} pendientes hoy` },
    { id: 'practice', title: 'Práctica Abierta', subtitle: 'Todo el catálogo · sin límite SRS' },
    ...(mistakeConceptCount > 0
      ? [{ id: 'review' as SessionMode, title: 'Revisar Errores', subtitle: `${mistakeConceptCount} concepto${mistakeConceptCount !== 1 ? 's' : ''} con errores` }]
      : []),
  ]

  const pillBase: React.CSSProperties = {
    borderRadius: 99, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
    whiteSpace: 'nowrap', flexShrink: 0,
    minHeight: '2.75rem', display: 'flex', alignItems: 'center',
    transition: 'background 200ms ease-out, color 200ms ease-out',
  }

  return (
    <div className="relative overflow-hidden">
      <BackgroundMagicS opacity={0.05} />
      {/* ── Mode section ─────────────────────────────────────────────────── */}
      <div className="px-4">
        <p style={EYEBROW}>Modo de estudio</p>
        <div className="flex flex-col gap-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSessionMode(mode.id)}
              className="senda-focus-ring"
              style={{
                position: 'relative', textAlign: 'left',
                borderRadius: '0.75rem', padding: '0.75rem 1rem', border: 'none', cursor: 'pointer',
                background: sessionMode === mode.id ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                transition: 'background 200ms ease-out, color 200ms ease-out',
              }}
            >
              {sessionMode === mode.id && (
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                  <svg viewBox="0 0 18 8" width={13} height={6}>
                    <path
                      d="M 1 5 C 4 2, 7 6, 11 4 C 14 2, 17 4, 17 4"
                      stroke="var(--d5-paper)" strokeWidth={2} strokeLinecap="round" fill="none"
                    />
                  </svg>
                </div>
              )}
              <div style={{
                fontFamily: 'var(--font-lora), serif', fontWeight: 600, fontStyle: 'italic', fontSize: 14,
                color: sessionMode === mode.id ? 'var(--d5-paper)' : 'var(--d5-heading)',
                marginBottom: 2,
              }}>
                {mode.title}
              </div>
              <div style={{
                fontSize: 10,
                color: sessionMode === mode.id ? 'var(--d5-paper-75)' : 'var(--d5-subtle)',
                fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              }}>
                {mode.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      <WindingPathSeparator />

      {/* ── Options — hidden in review mode ──────────────────────────────── */}
      {sessionMode !== 'review' && (
        <>
          {/* Module pills — multi-select; empty = all modules */}
          <div className="px-4">
            <p style={EYEBROW}>Módulo</p>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              <button
                onClick={() => setSelectedModules([])}
                className="senda-focus-ring"
                style={{
                  ...pillBase,
                  padding: '0 1rem',
                  background: selectedModules.length === 0 ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                  color: selectedModules.length === 0 ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
                  fontSize: 12, fontWeight: 700,
                }}
              >
                Todos
              </button>
              {modules.map((mod) => {
                const active = selectedModules.includes(mod.id)
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className="senda-focus-ring"
                    style={{
                      ...pillBase,
                      padding: '0 1rem',
                      background: active ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                      color: active ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
                      fontSize: 12, maxWidth: '8.75rem', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {mod.title.split(':')[0].trim()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Session size pills */}
          <div className="px-4 mt-4">
            <p style={EYEBROW}>¿Cuántos ejercicios?</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {SESSION_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSessionSize(size)}
                  className="senda-focus-ring"
                  style={{
                    ...pillBase,
                    padding: '0 1rem',
                    background: sessionSize === size ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                    color: sessionSize === size ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
                    fontSize: 12, fontWeight: sessionSize === size ? 700 : 500,
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise type grid */}
          <div className="px-4 mt-4">
            <p style={EYEBROW}>Tipos de ejercicio</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {EXERCISE_TYPES.map((type) => {
                const active = selectedTypes.includes(type.value)
                return (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className="senda-focus-ring"
                    style={{
                      padding: '0.75rem 0.5rem', borderRadius: '0.5rem', textAlign: 'center',
                      border: 'none', cursor: 'pointer', minHeight: 44,
                      fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                      fontSize: 11,
                      background: active ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                      fontWeight: active ? 700 : 500,
                      color: active ? 'var(--d5-paper)' : 'var(--d5-pill-text-soft)',
                      transition: 'background 200ms ease-out, color 200ms ease-out',
                    }}
                  >
                    {type.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      <WindingPathSeparator />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-5">
        <button
          onClick={handleStart}
          className="senda-focus-ring"
          style={{
            background: 'var(--d5-terracotta)', color: 'var(--d5-paper)',
            border: 'none', borderRadius: 99, padding: '0.75rem 0', width: '100%',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            transition: 'opacity 200ms ease-out',
          }}
        >
          Empezar Sesión →
        </button>
      </div>
    </div>
  )
}
