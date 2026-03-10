'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'

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

// Shared eyebrow style — uses D5.muted (lighter than dashboard warm eyebrows)
const EYEBROW: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--d5-muted)',
  marginBottom: 10,
  fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif',
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
      ? [{ id: 'review' as SessionMode, title: 'Revisar Errores', subtitle: 'Conceptos donde fallaste' }]
      : []),
  ]

  const pillBase: React.CSSProperties = {
    borderRadius: 99, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif',
    whiteSpace: 'nowrap', flexShrink: 0,
    minHeight: 44, display: 'flex', alignItems: 'center',
  }

  return (
    <div>
      {/* ── Mode section ─────────────────────────────────────────────────── */}
      <div className="px-[18px]">
        <p style={EYEBROW}>Modo de estudio</p>
        <div className="flex flex-col gap-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSessionMode(mode.id)}
              style={{
                position: 'relative', textAlign: 'left',
                borderRadius: 12, padding: '10px 14px', border: 'none', cursor: 'pointer',
                background: sessionMode === mode.id ? 'var(--d5-terracotta)' : 'rgba(26,17,8,0.02)',
              }}
            >
              {sessionMode === mode.id && (
                <div style={{ position: 'absolute', top: 10, right: 12 }}>
                  <svg viewBox="0 0 18 8" width={13} height={6}>
                    <path
                      d="M 1 5 C 4 2, 7 6, 11 4 C 14 2, 17 4, 17 4"
                      stroke="var(--d5-paper)" strokeWidth={2} strokeLinecap="round" fill="none"
                    />
                  </svg>
                </div>
              )}
              <div style={{
                fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 14,
                color: sessionMode === mode.id ? 'var(--d5-paper)' : 'var(--d5-ink)',
                marginBottom: 2,
              }}>
                {mode.title}
              </div>
              <div style={{
                fontSize: 10,
                color: sessionMode === mode.id ? 'rgba(253,252,249,0.75)' : 'var(--d5-muted)',
                fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif',
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
          <div className="px-[18px]">
            <p style={EYEBROW}>Módulo</p>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              <button
                onClick={() => setSelectedModules([])}
                style={{
                  ...pillBase,
                  padding: '0 16px',
                  background: selectedModules.length === 0 ? 'var(--d5-terracotta)' : 'rgba(26,17,8,0.03)',
                  color: selectedModules.length === 0 ? 'var(--d5-paper)' : 'rgba(26,17,8,0.6)',
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
                    style={{
                      ...pillBase,
                      padding: '0 14px',
                      background: active ? 'var(--d5-terracotta)' : 'rgba(26,17,8,0.03)',
                      color: active ? 'var(--d5-paper)' : 'rgba(26,17,8,0.6)',
                      fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {mod.title.split(':')[0].trim()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Session size pills */}
          <div className="px-[18px] mt-4">
            <p style={EYEBROW}>¿Cuántos ejercicios?</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SESSION_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSessionSize(size)}
                  style={{
                    ...pillBase,
                    padding: '0 18px',
                    background: sessionSize === size ? 'var(--d5-terracotta)' : 'rgba(26,17,8,0.03)',
                    color: sessionSize === size ? 'var(--d5-paper)' : 'rgba(26,17,8,0.6)',
                    fontSize: 12, fontWeight: sessionSize === size ? 700 : 400,
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise type grid */}
          <div className="px-[18px] mt-4">
            <p style={EYEBROW}>Tipos de ejercicio</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {EXERCISE_TYPES.map((type) => {
                const active = selectedTypes.includes(type.value)
                return (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    style={{
                      padding: '12px 8px', borderRadius: 8, textAlign: 'center',
                      border: 'none', cursor: 'pointer', minHeight: 44,
                      fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif',
                      fontSize: 11,
                      background: active ? 'var(--d5-terracotta)' : 'rgba(26,17,8,0.03)',
                      fontWeight: active ? 700 : 400,
                      color: active ? 'var(--d5-paper)' : 'rgba(26,17,8,0.4)',
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
      <div className="px-[18px] pt-2 pb-5">
        <button
          onClick={handleStart}
          style={{
            background: 'var(--d5-terracotta)', color: 'var(--d5-paper)',
            border: 'none', borderRadius: 99, padding: '13px 0', width: '100%',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif',
          }}
        >
          Empezar Sesión →
        </button>
      </div>
    </div>
  )
}
