// Senda skeleton — ink/5 fill, no borders, gentle opacity pulse
function Bone({ className }: { className: string }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse rounded-xl ${className}`} />
}

export default function ProgressLoading() {
  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-8 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Bone className="h-8 w-32" />
          <Bone className="h-4 w-48 rounded-lg" />
        </div>
        <Bone className="h-6 w-16 rounded-full" />
      </div>

      {/* Stats chips skeleton — no border */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl p-5 space-y-2 senda-skeleton-fill animate-senda-pulse">
            <div className="w-8 h-8 rounded-full bg-foreground/5" />
            <div className="h-7 w-12 rounded-lg bg-foreground/5" />
            <div className="space-y-1">
              <div className="h-3 w-20 rounded bg-foreground/5" />
              <div className="h-3 w-16 rounded bg-foreground/5" />
            </div>
          </div>
        ))}
      </div>

      {/* CEFR bars skeleton */}
      <div className="rounded-xl p-5 space-y-4 senda-skeleton-fill animate-senda-pulse">
        <div className="h-4 w-32 rounded bg-foreground/5" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-16 rounded bg-foreground/5" />
            <div className="h-2 w-full rounded-full bg-foreground/5" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-xl p-5 senda-skeleton-fill animate-senda-pulse">
        <div className="h-40 w-full rounded-lg bg-foreground/5" />
      </div>
    </main>
  )
}
