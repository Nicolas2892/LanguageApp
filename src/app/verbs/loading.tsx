function Bone({ className }: { className: string }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse ${className}`} />
}

function RowBone() {
  return (
    <div className="flex items-center gap-3 py-3 px-4" style={{ borderBottom: '1px solid var(--d5-divider)' }}>
      <Bone className="h-2.5 w-2.5 rounded-full shrink-0" />
      <div className="flex-1 flex items-center gap-2">
        <Bone className="h-4 w-20 rounded" />
        <Bone className="h-3 w-24 rounded" />
      </div>
      <Bone className="h-5 w-10 rounded" />
    </div>
  )
}

export default function VerbsLoading() {
  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Bone className="h-8 w-40 rounded-xl" />
        <Bone className="h-4 w-56 rounded-lg" />
      </div>

      {/* Search bar skeleton */}
      <Bone className="h-10 w-full rounded-lg" />

      {/* Letter group skeletons */}
      {['A', 'C', 'D'].map((letter) => (
        <div key={letter} className="space-y-0">
          <Bone className="h-3 w-4 rounded mb-2" />
          {Array.from({ length: 4 }, (_, i) => (
            <RowBone key={i} />
          ))}
        </div>
      ))}
    </main>
  )
}
