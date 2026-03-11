export type VerbGroup = '-ar' | '-er' | '-ir' | 'irregular'

const VERB_GROUP_CONFIG: Record<VerbGroup, { label: string; className: string }> = {
  '-ar':       { label: '-ar',       className: 'bg-[rgba(56,102,100,0.10)] dark:bg-[rgba(56,102,100,0.20)] text-[#386664] dark:text-[#7BB8B5] border-[rgba(56,102,100,0.25)] dark:border-[rgba(56,102,100,0.35)]' },
  '-er':       { label: '-er',       className: 'bg-[rgba(105,70,110,0.10)] dark:bg-[rgba(105,70,110,0.20)] text-[#69466E] dark:text-[#BF96C4] border-[rgba(105,70,110,0.25)] dark:border-[rgba(105,70,110,0.35)]' },
  '-ir':       { label: '-ir',       className: 'bg-[rgba(139,115,50,0.10)] dark:bg-[rgba(139,115,50,0.20)] text-[#8B7332] dark:text-[#C4AD6A] border-[rgba(139,115,50,0.25)] dark:border-[rgba(139,115,50,0.35)]' },
  'irregular': { label: 'irreg.',    className: 'bg-[rgba(168,80,60,0.10)] dark:bg-[rgba(168,80,60,0.20)] text-[#A8503C] dark:text-[#D4937F] border-[rgba(168,80,60,0.25)] dark:border-[rgba(168,80,60,0.35)]' },
}

interface Props {
  group: string | null | undefined
}

export function VerbGroupChip({ group }: Props) {
  if (!group) return null
  // Normalise: verb_group from DB is "ar"/"er"/"ir"/"irregular"
  const key = group === 'irregular' ? 'irregular' : `-${group}` as VerbGroup
  if (!(key in VERB_GROUP_CONFIG)) return null
  const { label, className } = VERB_GROUP_CONFIG[key]
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${className}`}>
      {label}
    </span>
  )
}
