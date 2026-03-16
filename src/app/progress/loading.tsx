import { WindingPathSeparator } from '@/components/WindingPathSeparator'

function Bone({ className }: { className: string }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse ${className}`} />
}

export default function ProgressLoading() {
  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Bone className="h-7 w-36 rounded-xl" />
          <Bone className="h-4 w-44 rounded-lg mt-1" />
        </div>

        <WindingPathSeparator />

        {/* Stats row — 3-col grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="senda-card-sm text-center space-y-1">
              <Bone className="h-6 w-10 rounded-lg mx-auto" />
              <Bone className="h-2 w-14 rounded mx-auto" />
              <Bone className="h-2 w-10 rounded mx-auto" />
            </div>
          ))}
        </div>

        <WindingPathSeparator />

        {/* CEFR Journey */}
        <section className="space-y-4 px-1">
          <Bone className="h-2.5 w-28 rounded" />
          <div className="space-y-5">
            {['B1', 'B2', 'C1'].map((level) => (
              <div key={level} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Bone className="h-4 w-8 rounded" />
                  <Bone className="h-3 w-24 rounded" />
                </div>
                <Bone className="h-1 w-full rounded-full" />
              </div>
            ))}
          </div>
        </section>

        <WindingPathSeparator />

        {/* Verb mastery */}
        <section className="space-y-4 px-1">
          <Bone className="h-2.5 w-36 rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Bone className="h-3 w-20 rounded" />
                <Bone className="h-3 w-10 rounded" />
              </div>
              <Bone className="h-1 w-full rounded-full" />
            </div>
          ))}
        </section>

        <WindingPathSeparator />

        {/* Weekly activity chart */}
        <section className="space-y-3">
          <Bone className="h-2.5 w-32 rounded" />
          <Bone className="h-40 w-full rounded-xl" />
        </section>
      </div>
    </main>
  )
}
