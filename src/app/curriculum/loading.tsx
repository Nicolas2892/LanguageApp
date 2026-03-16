function Bone({ className }: { className: string }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse ${className}`} />
}

export default function CurriculumLoading() {
  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Bone className="h-8 w-40 rounded-xl" />
        <Bone className="h-4 w-56 rounded-lg" />
      </div>

      {/* Module accordion skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl p-5 space-y-3 senda-skeleton-fill animate-senda-pulse">
          <Bone className="h-5 w-48 rounded-lg" />
          <Bone className="h-1.5 w-3/4 rounded-full" />
          <div className="space-y-2 pl-4 pt-1">
            {[1, 2, 3].map((j) => (
              <Bone key={j} className="h-4 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}
