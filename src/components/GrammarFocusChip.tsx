export type GrammarFocus = 'indicative' | 'subjunctive' | 'both'

const GRAMMAR_FOCUS_CONFIG: Record<GrammarFocus, { label: string; className: string }> = {
  indicative:  { label: 'Indicative',  className: 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800' },
  subjunctive: { label: 'Subjunctive', className: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800' },
  both:        { label: 'Both moods',  className: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
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
