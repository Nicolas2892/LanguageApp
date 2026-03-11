export type GrammarFocus = 'indicative' | 'subjunctive' | 'both'

const GRAMMAR_FOCUS_CONFIG: Record<GrammarFocus, { label: string; className: string }> = {
  indicative:  { label: 'Indicative',  className: 'bg-[rgba(74,103,65,0.10)] dark:bg-[rgba(74,103,65,0.20)] text-[#4A6741] dark:text-[#8BB880] border-[rgba(74,103,65,0.25)] dark:border-[rgba(74,103,65,0.35)]' },
  subjunctive: { label: 'Subjunctive', className: 'bg-[rgba(123,82,114,0.10)] dark:bg-[rgba(123,82,114,0.20)] text-[#7B5272] dark:text-[#C49AB8] border-[rgba(123,82,114,0.25)] dark:border-[rgba(123,82,114,0.35)]' },
  both:        { label: 'Both moods',  className: 'bg-[rgba(139,115,50,0.10)] dark:bg-[rgba(139,115,50,0.20)] text-[#8B7332] dark:text-[#C4AD6A] border-[rgba(139,115,50,0.25)] dark:border-[rgba(139,115,50,0.35)]' },
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
