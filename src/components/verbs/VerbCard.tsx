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
  style?: React.CSSProperties
}

export function VerbCard({ id, infinitive, english, verbGroup, favorited, masteryState, style }: Props) {
  return (
    <Link
      href={`/verbs/${infinitive}`}
      className="relative senda-card animate-card-in hover:shadow-md transition-shadow flex flex-col gap-2 min-h-[7rem]"
      style={style}
    >
      <div className="flex items-start justify-between gap-1">
        <div>
          <p className="font-bold text-base">{infinitive}</p>
          <p className="text-xs text-muted-foreground">{english}</p>
        </div>
        <VerbGroupChip group={verbGroup} />
      </div>
      <div className="flex items-center justify-between mt-auto">
        {masteryState !== 'none' ? (
          <span
            title={masteryState === 'mastered' ? 'Dominado' : 'En progreso'}
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              masteryState === 'mastered' ? 'bg-primary' : 'bg-amber-400'
            }`}
          />
        ) : (
          <span />
        )}
        <VerbFavoriteButton verbId={id} initialFavorited={favorited} />
      </div>
    </Link>
  )
}
