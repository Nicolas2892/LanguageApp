import { SvgSendaPath } from '@/components/SvgSendaPath'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'

export default function VocabConfigureLoading() {
  return (
    <main className="max-w-md mx-auto pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="h-3 w-24 senda-skeleton-fill animate-senda-pulse rounded" />
        <SvgSendaPath size={22} strokeWidth={3.5} />
        <div style={{ width: 22 }} />
      </div>

      <div className="px-4 pt-1 pb-3">
        <div className="h-6 w-48 senda-skeleton-fill animate-senda-pulse rounded" />
      </div>

      <WindingPathSeparator />

      {/* Category pills */}
      <div className="px-4 space-y-2">
        <div className="h-3 w-20 senda-skeleton-fill animate-senda-pulse rounded" />
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-11 w-32 senda-skeleton-fill animate-senda-pulse rounded-full" />
          ))}
        </div>
      </div>

      <WindingPathSeparator />

      {/* Length pills */}
      <div className="px-4 space-y-2">
        <div className="h-3 w-24 senda-skeleton-fill animate-senda-pulse rounded" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 w-16 senda-skeleton-fill animate-senda-pulse rounded-full" />
          ))}
        </div>
      </div>

      <WindingPathSeparator />

      {/* CTA */}
      <div className="px-4 pt-2 pb-5">
        <div className="h-12 w-full senda-skeleton-fill animate-senda-pulse rounded-full" />
      </div>
    </main>
  )
}
