interface WeeklySnapshotProps {
  exercises: number
  accuracy: number | null
  minutes: number
  exerciseDelta: number | null
  accuracyDelta: number | null
  minutesDelta: number | null
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground text-xs">—</span>
  if (delta > 0) return <span className="text-green-600 dark:text-green-400 text-xs">▲+{delta}</span>
  if (delta < 0) return <span className="text-red-500 text-xs">▼{delta}</span>
  return <span className="text-muted-foreground text-xs">=</span>
}

export function WeeklySnapshot({
  exercises,
  accuracy,
  minutes,
  exerciseDelta,
  accuracyDelta,
  minutesDelta,
}: WeeklySnapshotProps) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">This week</p>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-extrabold">{exercises}</p>
          <p className="text-xs text-muted-foreground mt-0.5">exercises</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold">{accuracy !== null ? `${accuracy}%` : '—%'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">accuracy</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold">{minutes}</p>
          <p className="text-xs text-muted-foreground mt-0.5">minutes</p>
        </div>
      </div>
    </div>
  )
}
