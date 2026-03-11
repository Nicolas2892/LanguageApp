import Link from 'next/link'
import { VerbFavoriteButton } from './VerbFavoriteButton'
import { VerbGroupChip } from './VerbGroupChip'

interface MasteryDot {
  tense: string
  pct: number
}

interface Props {
  id: string
  infinitive: string
  english: string
  verbGroup: string
  favorited: boolean
  masteryDots: MasteryDot[]
  style?: React.CSSProperties
}

/** A single dot per tense; filled (green) when accuracy ≥ 70%. */
function MasteryDots({ dots }: { dots: MasteryDot[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {dots.map((d) => (
        <span
          key={d.tense}
          title={`${d.tense.replace(/_/g, ' ')}: ${d.pct}%`}
          className={`inline-block h-2 w-2 rounded-full ${
            d.pct >= 70
              ? 'bg-primary'
              : d.pct > 0
              ? 'bg-amber-400'
              : 'bg-muted-foreground/25'
          }`}
        />
      ))}
    </div>
  )
}

export function VerbCard({ id, infinitive, english, verbGroup, favorited, masteryDots, style }: Props) {
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
        <MasteryDots dots={masteryDots} />
        <VerbFavoriteButton verbId={id} initialFavorited={favorited} />
      </div>
    </Link>
  )
}
