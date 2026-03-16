import { WindingPathSeparator } from '@/components/WindingPathSeparator'

function Bone({ className }: { className: string }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse ${className}`} />
}

export default function DashboardLoading() {
  return (
    <main className="max-w-2xl mx-auto px-5 pt-5 pb-[calc(3.125rem+env(safe-area-inset-bottom)+1rem)] lg:px-8 lg:pt-8 lg:pb-8">
      {/* Greeting */}
      <div className="mb-3">
        <Bone className="h-7 w-48 rounded-xl" />
        <Bone className="h-5 w-16 rounded-full mt-2" />
      </div>

      <WindingPathSeparator />

      {/* Tu Senda Diaria card */}
      <div className="senda-card mt-4 space-y-3">
        <Bone className="h-2.5 w-24 rounded" />
        <Bone className="h-5 w-56 rounded-lg" />
        <Bone className="h-3 w-32 rounded" />
        <Bone className="h-10 w-full rounded-full" />
      </div>

      {/* Card stack wrapper */}
      <div className="relative mt-4">
        <WindingPathSeparator />

        {/* Exploración Abierta card */}
        <div className="senda-card space-y-3">
          <Bone className="h-2.5 w-28 rounded" />
          <Bone className="h-5 w-64 rounded-lg" />
          <Bone className="h-3 w-40 rounded" />
          <Bone className="h-10 w-full rounded-full" />
        </div>

        <WindingPathSeparator />

        {/* Deferred section placeholders */}
        <div className="senda-skeleton-fill animate-senda-pulse rounded-[20px] h-24" />
        <WindingPathSeparator />
        <div className="senda-skeleton-fill animate-senda-pulse rounded-[20px] h-36" />
        <WindingPathSeparator />
        <div className="senda-skeleton-fill animate-senda-pulse rounded-[20px] h-36" />
      </div>
    </main>
  )
}
