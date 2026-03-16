import { WindingPathSeparator } from '@/components/WindingPathSeparator'

function Bone({ className }: { className: string }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse ${className}`} />
}

export default function AccountLoading() {
  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Header + avatar row */}
      <div className="mb-6">
        <Bone className="h-7 w-32 rounded-xl mb-3" />
        <div className="flex items-center gap-4">
          <Bone className="h-11 w-11 rounded-full shrink-0" />
          <div className="space-y-1">
            <Bone className="h-4 w-28 rounded" />
            <Bone className="h-3 w-40 rounded" />
          </div>
        </div>
      </div>

      <WindingPathSeparator />

      {/* Profile form section */}
      <div className="senda-card mt-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <Bone className="h-3 w-24 rounded" />
            <Bone className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Bone className="h-10 w-full rounded-full mt-2" />
      </div>

      <div className="mt-8">
        <WindingPathSeparator />
      </div>

      {/* Security section */}
      <div className="senda-card mt-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <Bone className="h-3 w-28 rounded" />
            <Bone className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Bone className="h-10 w-full rounded-full mt-2" />
      </div>

      <div className="mt-8">
        <WindingPathSeparator />
      </div>

      {/* Notification section */}
      <div className="senda-card mt-6 space-y-3">
        <Bone className="h-4 w-32 rounded" />
        <div className="flex items-center justify-between">
          <Bone className="h-3 w-40 rounded" />
          <Bone className="h-5 w-9 rounded-full" />
        </div>
      </div>
    </main>
  )
}
