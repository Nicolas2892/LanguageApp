import { CheckCircle2, XCircle } from 'lucide-react'
import { SCORE_CONFIG } from '@/lib/scoring'
import type { OfflineReportAttempt } from '@/lib/supabase/types'

interface Props {
  attempt: OfflineReportAttempt
}

const TYPE_LABELS: Record<string, string> = {
  gap_fill: 'Completar Hueco',
  translation: 'Traducción',
  transformation: 'Transformación',
  sentence_builder: 'Constructor De Frases',
  error_correction: 'Corrección De Errores',
  free_write: 'Escritura Libre',
  proofreading: 'Corrección De Texto',
  register_shift: 'Cambio De Registro',
}

export function ReportAttemptRow({ attempt }: Props) {
  const scoreConfig = SCORE_CONFIG[attempt.score as keyof typeof SCORE_CONFIG]

  return (
    <div className="senda-card" style={{ marginBottom: '0.75rem' }}>
      {/* Type eyebrow + concept */}
      <div className="flex items-center gap-2 mb-2">
        <span className="senda-eyebrow">
          {TYPE_LABELS[attempt.exercise_type] ?? attempt.exercise_type}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--d5-body)' }}>
          {attempt.concept_title}
        </span>
      </div>

      {/* Prompt */}
      <p className="text-sm mb-2" style={{ color: 'var(--d5-ink)' }}>
        {attempt.exercise_prompt}
      </p>

      {/* User answer + score */}
      <div className="flex items-start gap-2 mb-2">
        {attempt.is_correct ? (
          <CheckCircle2 size={16} strokeWidth={1.5} className="shrink-0 mt-0.5 text-green-600" />
        ) : (
          <XCircle size={16} strokeWidth={1.5} className="shrink-0 mt-0.5 text-red-500" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: attempt.is_correct ? '#16a34a' : '#dc2626' }}>
            {attempt.user_answer}
          </p>
        </div>
        {scoreConfig && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold border ${scoreConfig.className}`}
          >
            {scoreConfig.label}
          </span>
        )}
      </div>

      {/* Feedback */}
      {attempt.feedback && (
        <p className="text-xs mb-1.5" style={{ color: 'var(--d5-body)' }}>
          {attempt.feedback}
        </p>
      )}

      {/* Corrected version */}
      {attempt.corrected_version && !attempt.is_correct && (
        <div
          className="rounded-lg px-3 py-2 text-sm mb-1.5"
          style={{
            background: 'rgba(34,197,94,0.06)',
            color: '#16a34a',
          }}
        >
          ✓ {attempt.corrected_version}
        </div>
      )}

      {/* Explanation */}
      {attempt.explanation && (
        <p className="text-xs italic" style={{ color: 'var(--d5-muted)' }}>
          {attempt.explanation}
        </p>
      )}
    </div>
  )
}
