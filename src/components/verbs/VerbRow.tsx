import Link from 'next/link'
import { VerbFavoriteButton } from './VerbFavoriteButton'
import { VerbGroupChip } from './VerbGroupChip'

export type VerbMasteryState = 'mastered' | 'in_progress' | 'none'

interface Props {
  id: string
  infinitive: string
  english: string
  verbGroup: string
  favorited: boolean
  masteryState: VerbMasteryState
  isLast?: boolean
  style?: React.CSSProperties
}

export function VerbRow({ id, infinitive, english, verbGroup, favorited, masteryState, isLast, style }: Props) {
  return (
    <div
      className="animate-card-in"
      style={{
        ...style,
        borderBottom: isLast ? undefined : '1px solid var(--d5-divider)',
      }}
    >
      <Link
        href={`/verbs/${infinitive}`}
        className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50 transition-colors -mx-4"
        style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
      >
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

        {/* Infinitive + english */}
        <span className="flex-1 min-w-0 truncate">
          <span className="font-bold text-sm">{infinitive}</span>
          <span className="text-muted-foreground text-sm"> — {english}</span>
        </span>

        {/* Group chip + favorite */}
        <span className="flex items-center gap-2 shrink-0" onClick={(e) => e.preventDefault()}>
          <VerbGroupChip group={verbGroup} />
          <VerbFavoriteButton verbId={id} initialFavorited={favorited} />
        </span>
      </Link>
    </div>
  )
}
