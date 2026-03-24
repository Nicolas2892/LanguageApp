import { VocabCategoryChip } from './VocabCategoryChip'

export type VocabMasteryState = 'mastered' | 'in_progress' | 'none'

interface Props {
  expression: string
  english: string
  category: string
  masteryState: VocabMasteryState
  isLast?: boolean
  style?: React.CSSProperties
}

export function VocabRow({ expression, english, category, masteryState, isLast, style }: Props) {
  return (
    <div
      className="animate-card-in"
      style={{
        ...style,
        borderBottom: isLast ? undefined : '1px solid var(--d5-divider)',
      }}
    >
      <div className="flex items-center gap-3 py-3 px-4 -mx-4" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        {/* Mastery dot */}
        <span
          title={
            masteryState === 'mastered'
              ? 'Dominado'
              : masteryState === 'in_progress'
                ? 'En progreso'
                : undefined
          }
          className={`shrink-0 h-2.5 w-2.5 rounded-full ${
            masteryState === 'mastered'
              ? 'bg-primary'
              : masteryState === 'in_progress'
                ? 'bg-amber-400'
                : ''
          }`}
          style={masteryState === 'none' ? { background: 'transparent' } : undefined}
        />

        {/* Expression + english */}
        <span className="flex-1 min-w-0 truncate">
          <span className="font-bold text-sm">{expression}</span>
          <span className="text-muted-foreground text-sm"> — {english}</span>
        </span>

        {/* Category chip */}
        <span className="shrink-0">
          <VocabCategoryChip category={category} />
        </span>
      </div>
    </div>
  )
}
