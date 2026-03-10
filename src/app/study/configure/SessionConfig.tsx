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
  const [selectedModule, setSelectedModule] = useState<string>('all')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [sessionSize, setSessionSize] = useState(DEFAULT_SIZE)

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
    if (selectedModule !== 'all') params.set('module', selectedModule)
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
  }

  return (
    <div>
      {/* ── Mode section ─────────────────────────────────────────────────── */}
      <div className="px-[18px]">
        <p className="senda-eyebrow mb-2">Modo de estudio</p>
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
          {/* Module pills */}
          <div className="px-[18px]">
            <p className="senda-eyebrow mb-2">Módulo</p>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              <button
                onClick={() => setSelectedModule('all')}
                style={{
                  ...pillBase,
                  padding: '5px 12px',
                  background: selectedModule === 'all' ? 'var(--d5-terracotta)' : 'rgba(26,17,8,0.03)',
                  color: selectedModule === 'all' ? 'var(--d5-paper)' : 'rgba(26,17,8,0.6)',
                  fontSize: 10, fontWeight: 700,
                }}
              >
                Todos
              </button>
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod.id)}
                  style={{
                    ...pillBase,
                    padding: '5px 10px',
                    background: selectedModule === mod.id ? 'var(--d5-terracotta)' : 'rgba(26,17,8,0.03)',
                    color: selectedModule === mod.id ? 'var(--d5-paper)' : 'rgba(26,17,8,0.6)',
                    fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {mod.title.split(':')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Session size pills */}
          <div className="px-[18px] mt-4">
            <p className="senda-eyebrow mb-2">¿Cuántos ejercicios?</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SESSION_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSessionSize(size)}
                  style={{
                    ...pillBase,
                    padding: '5px 14px',
                    background: sessionSize === size ? 'var(--d5-terracotta)' : 'rgba(26,17,8,0.03)',
                    color: sessionSize === size ? 'var(--d5-paper)' : 'rgba(26,17,8,0.6)',
                    fontSize: 10, fontWeight: sessionSize === size ? 700 : 400,
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise type grid */}
          <div className="px-[18px] mt-4">
            <p className="senda-eyebrow mb-2">Tipos de ejercicio</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {EXERCISE_TYPES.map((type) => {
                const active = selectedTypes.includes(type.value)
                return (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    style={{
                      padding: '7px 8px', borderRadius: 8, textAlign: 'center', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif',
                      fontSize: 9,
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
      <div className="px-[18px] pb-5">
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
