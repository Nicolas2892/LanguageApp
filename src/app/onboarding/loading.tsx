import { SvgSendaPath } from '@/components/SvgSendaPath'

export default function OnboardingLoading() {
  return (
    <main className="min-h-screen flex items-start justify-center bg-background">
      <div className="w-full max-w-2xl mx-auto p-6 md:p-10">
        <div className="mb-8 space-y-2">
          <SvgSendaPath size={28} />
          <div className="h-7 w-64 senda-skeleton-fill animate-senda-pulse rounded" />
          <div className="h-4 w-80 senda-skeleton-fill animate-senda-pulse rounded" />
          <div className="h-3 w-36 senda-skeleton-fill animate-senda-pulse rounded" />
        </div>

        {/* Diagnostic card skeleton */}
        <div className="senda-card space-y-5">
          <div className="h-3 w-20 senda-skeleton-fill animate-senda-pulse rounded" />
          <div className="h-5 w-full senda-skeleton-fill animate-senda-pulse rounded" />
          <div className="space-y-3">
            <div className="h-10 w-full senda-skeleton-fill animate-senda-pulse rounded-lg" />
            <div className="h-10 w-full senda-skeleton-fill animate-senda-pulse rounded-lg" />
            <div className="h-10 w-full senda-skeleton-fill animate-senda-pulse rounded-lg" />
          </div>
          <div className="h-11 w-full senda-skeleton-fill animate-senda-pulse rounded-full" />
        </div>
      </div>
    </main>
  )
}
