// Senda skeleton — ink/5 fill, no borders, gentle opacity pulse
function Bone({ className }: { className: string }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse rounded-xl ${className}`} />
}

export default function DashboardLoading() {
  return (
    <main className="max-w-lg mx-auto p-6 md:p-8 space-y-6">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <Bone className="h-8 w-48" />
        <Bone className="h-4 w-64 rounded-lg" />
      </div>

      {/* Stats card skeleton — no border, surface elevation only */}
      <div className="rounded-xl p-4 space-y-3 senda-skeleton-fill animate-senda-pulse">
        <div className="flex items-center gap-6">
          <div className="h-12 w-24 rounded-lg bg-foreground/5" />
          <div className="h-12 w-24 rounded-lg bg-foreground/5" />
        </div>
        <div className="h-2.5 w-full rounded-full bg-foreground/5" />
      </div>

      {/* Mode cards skeleton */}
      <div className="space-y-3">
        {[72, 80, 72].map((w, i) => (
          <div key={i} className="rounded-xl p-6 space-y-3 senda-skeleton-fill animate-senda-pulse">
            <div className={`h-3 w-${w === 72 ? '20' : '24'} rounded-lg bg-foreground/5`} />
            <div className="h-6 w-40 rounded-lg bg-foreground/5" />
            <div className="h-10 w-full rounded-full bg-foreground/5" />
          </div>
        ))}
      </div>
    </main>
  )
}
