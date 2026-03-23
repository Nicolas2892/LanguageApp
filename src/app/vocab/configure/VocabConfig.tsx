'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VOCAB_CATEGORIES, CATEGORY_LABELS } from '@/lib/vocab/constants'
import type { VocabCategory } from '@/lib/vocab/constants'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'

const LENGTHS = [10, 20, 30] as const
const LEVELS = ['B1', 'B2', 'C1'] as const

const EYEBROW: React.CSSProperties = {
  fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--d5-eyebrow)',
  marginBottom: '0.5rem',
  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
}

const pillBase: React.CSSProperties = {
  borderRadius: 99, border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
  whiteSpace: 'nowrap', flexShrink: 0,
  minHeight: '2.75rem', display: 'flex', alignItems: 'center',
  transition: 'background 200ms ease-out, color 200ms ease-out',
}

export function VocabConfig() {
  const router = useRouter()

  const [selectedCategories, setSelectedCategories] = useState<Set<VocabCategory>>(
    new Set(['discourse_markers'])
  )
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set())
  const [length, setLength] = useState<10 | 20 | 30>(10)
  const [showHint, setShowHint] = useState(true)

  function toggleCategory(cat: VocabCategory) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        if (next.size === 1) return prev  // must keep at least one
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  function toggleLevel(level: string) {
    setSelectedLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) {
        next.delete(level)
      } else {
        next.add(level)
      }
      return next
    })
  }

  function handleStart() {
    const params = new URLSearchParams()
    params.set('categories', Array.from(selectedCategories).join(','))
    if (selectedLevels.size > 0) {
      params.set('levels', Array.from(selectedLevels).join(','))
    }
    params.set('length', String(length))
    if (showHint) params.set('hint', '1')
    router.push(`/vocab/session?${params.toString()}`)
  }

  return (
    <div>
      {/* ── Categories ─────────────────────────────────────────────── */}
      <div className="px-4">
        <p style={EYEBROW}>Categorías</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {VOCAB_CATEGORIES.map((cat) => {
            const active = selectedCategories.has(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="senda-focus-ring"
                style={{
                  ...pillBase,
                  padding: '0 16px',
                  background: active ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                  color: active ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
                  fontSize: '0.75rem', fontWeight: active ? 700 : 500,
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            )
          })}
        </div>
      </div>

      <WindingPathSeparator />

      {/* ── Level filter ───────────────────────────────────────────── */}
      <div className="px-4">
        <p style={EYEBROW}>Nivel (opcional)</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LEVELS.map((level) => {
            const active = selectedLevels.has(level)
            return (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className="senda-focus-ring"
                style={{
                  ...pillBase,
                  padding: '0 16px',
                  background: active ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                  color: active ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
                  fontSize: '0.75rem', fontWeight: active ? 700 : 500,
                }}
              >
                {level}
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: '0.625rem', color: 'var(--d5-muted)', marginTop: '0.375rem', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
          Sin selección = todos los niveles
        </p>
      </div>

      <WindingPathSeparator />

      {/* ── Length ──────────────────────────────────────────────────── */}
      <div className="px-4">
        <p style={EYEBROW}>¿Cuántas frases?</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {LENGTHS.map((l) => {
            const active = length === l
            return (
              <button
                key={l}
                onClick={() => setLength(l)}
                className="senda-focus-ring"
                style={{
                  ...pillBase,
                  padding: '0 1rem',
                  background: active ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                  color: active ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
                  fontSize: '0.75rem', fontWeight: active ? 700 : 500,
                }}
              >
                {l}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Hint toggle ────────────────────────────────────────────── */}
      <div className="px-4 mt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showHint}
            onChange={(e) => setShowHint(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--d5-heading)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
            Mostrar pista en inglés
          </span>
        </label>
        <p style={{ fontSize: '0.625rem', color: 'var(--d5-muted)', marginTop: '0.25rem', marginLeft: '1.75rem', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
          Muestra una traducción breve del espacio en blanco.
        </p>
      </div>

      <WindingPathSeparator />

      {/* ── CTA ────────────────────────────────────────────────────── */}
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
          Empezar Práctica →
        </button>
      </div>
    </div>
  )
}
