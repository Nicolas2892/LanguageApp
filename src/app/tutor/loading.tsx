import { SvgSendaPath } from '@/components/SvgSendaPath'

function Bone({ className }: { className: string }) {
  return <div className={`senda-skeleton-fill animate-senda-pulse ${className}`} />
}

export default function TutorLoading() {
  return (
    <div className="flex flex-col h-[100dvh] pb-[calc(3.125rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Header */}
      <header
        className="px-4 py-3 shrink-0 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--d5-line)' }}
      >
        <SvgSendaPath size={24} />
        <div className="space-y-1">
          <Bone className="h-2.5 w-28 rounded" />
          <Bone className="h-5 w-20 rounded-lg" />
        </div>
      </header>

      {/* Chat empty state */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="text-center pt-12 space-y-3">
          <div className="flex justify-center">
            <SvgSendaPath size={40} />
          </div>
          <Bone className="h-6 w-52 rounded-lg mx-auto" />
          <Bone className="h-4 w-72 rounded mx-auto" />
          <Bone className="h-3 w-56 rounded mx-auto" />
          {/* Starter button bones */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Bone className="h-8 w-40 rounded-full" />
            <Bone className="h-8 w-36 rounded-full" />
            <Bone className="h-8 w-44 rounded-full" />
            <Bone className="h-8 w-48 rounded-full" />
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div
        className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2 items-end"
        style={{ borderTop: '1px solid var(--d5-line)' }}
      >
        <Bone className="h-[3.25rem] flex-1 rounded-md" />
        <Bone className="h-9 w-16 rounded-md shrink-0" />
      </div>
    </div>
  )
}
