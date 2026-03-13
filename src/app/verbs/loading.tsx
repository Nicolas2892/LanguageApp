// Senda skeleton — ink/5 fill, no borders, gentle opacity pulse
function Bone({ className }: { className: string }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse rounded-xl ${className}`} />
}

export default function VerbsLoading() {
  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Bone className="h-8 w-40" />
        <Bone className="h-4 w-56 rounded-lg" />
      </div>

      {/* Search bar skeleton */}
      <Bone className="h-10 w-full rounded-lg" />

      {/* Verb card grid skeleton — 3 columns × 4 rows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="rounded-xl p-4 space-y-2 senda-skeleton-fill animate-senda-pulse">
            <div className="h-5 w-20 rounded bg-foreground/5" />
            <div className="h-3 w-16 rounded bg-foreground/5" />
            <div className="flex gap-1 mt-1">
              {[1, 2, 3].map((d) => (
                <div key={d} className="h-2 w-2 rounded-full bg-foreground/5" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
