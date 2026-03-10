import React from 'react'

// Senda skeleton — ink/5 fill, no borders, gentle opacity pulse
function Bone({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse rounded-xl ${className}`} style={style} />
}

export default function CurriculumLoading() {
  return (
    <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Bone className="h-8 w-40" />
        <Bone className="h-4 w-56 rounded-lg" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-3">
        {[60, 44, 56, 60].map((w, i) => (
          <Bone key={i} className={`h-8 rounded-full`} style={{ width: w }} />
        ))}
      </div>

      {/* Module accordion skeletons — no border, surface fill only */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl p-5 space-y-3 senda-skeleton-fill animate-senda-pulse">
          <div className="h-5 w-48 rounded-lg bg-foreground/5" />
          <div className="h-1.5 w-3/4 rounded-full bg-foreground/5" />
          <div className="space-y-2 pl-4 pt-1">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-4 w-full rounded-lg bg-foreground/5" />
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}
