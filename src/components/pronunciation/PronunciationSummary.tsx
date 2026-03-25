'use client'

import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import type { PronunciationResult } from '@/lib/azure/client'

interface Props {
  results: PronunciationResult[]
  sessionUrl: string
}

export function PronunciationSummary({ results, sessionUrl }: Props) {
  const totalItems = results.length
  if (totalItems === 0) return null

  const avgOverall = Math.round(results.reduce((s, r) => s + r.overallScore, 0) / totalItems)
  const avgFluency = Math.round(results.reduce((s, r) => s + r.fluencyScore, 0) / totalItems)
  const avgProsody = Math.round(results.reduce((s, r) => s + r.prosodyScore, 0) / totalItems)

  const dimensions = [
    { label: 'Precisión', score: avgOverall },
    { label: 'Fluidez', score: avgFluency },
    { label: 'Prosodia', score: avgProsody },
  ].sort((a, b) => a.score - b.score)

  return (
    <div className="max-w-md mx-auto text-center space-y-6 animate-done-stagger">
      <div>
        <p className="senda-eyebrow mb-2">Sesión Completada</p>
        <p className="senda-heading text-3xl">{avgOverall}%</p>
        <p className="text-sm mt-1" style={{ color: 'var(--d5-warm)' }}>
          {totalItems} frases evaluadas
        </p>
      </div>

      {/* Per-dimension breakdown */}
      <div className="senda-card space-y-3 text-left">
        <p className="senda-eyebrow">Desglose</p>
        {dimensions.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="text-xs font-medium w-20 shrink-0" style={{ color: 'var(--d5-warm)' }}>
              {d.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.min(d.score, 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold w-8 text-right" style={{ color: 'var(--d5-ink)' }}>
              {d.score}%
            </span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="space-y-2">
        <Link
          href={sessionUrl}
          className="block w-full rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold text-center hover:bg-primary/90 transition-colors"
        >
          Practicar de Nuevo
        </Link>
        <Link href={ROUTES.pronunciation} className="senda-cta-outline w-full block text-center">
          Ver Progreso
        </Link>
        <Link href={ROUTES.dashboard} className="senda-cta-outline w-full block text-center">
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}
