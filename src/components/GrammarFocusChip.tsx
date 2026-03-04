export type GrammarFocus = 'indicative' | 'subjunctive' | 'both'

const GRAMMAR_FOCUS_CONFIG: Record<GrammarFocus, { label: string; className: string }> = {
  indicative:  { label: 'Indicative',  className: 'bg-sky-100 text-sky-700 border-sky-200' },
  subjunctive: { label: 'Subjunctive', className: 'bg-violet-100 text-violet-700 border-violet-200' },
  both:        { label: 'Both moods',  className: 'bg-amber-100 text-amber-700 border-amber-200' },
}

interface Props {
  focus: string | null | undefined
}

export function GrammarFocusChip({ focus }: Props) {
  if (!focus || !(focus in GRAMMAR_FOCUS_CONFIG)) return null
  const { label, className } = GRAMMAR_FOCUS_CONFIG[focus as GrammarFocus]
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${className}`}>
      {label}
    </span>
  )
}
