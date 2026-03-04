'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Timer, Hash, X } from 'lucide-react'

interface Module {
  id: string
  title: string
}

interface Props {
  dueCount: number
  modules: Module[]
  dueCountByModule?: Record<string, number>
}

const TIME_OPTIONS = [5, 10, 15] as const
const COUNT_OPTIONS = [5, 10, 15, 20] as const

export function SprintCard({ dueCount, modules, dueCountByModule = {} }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [limitType, setLimitType] = useState<'time' | 'count'>('time')
  const [limit, setLimit] = useState(10)
  const [moduleId, setModuleId] = useState('')

  function handleStartSprint(overrideLimitType?: 'time' | 'count', overrideLimit?: number) {
    const params = new URLSearchParams({
      mode: 'sprint',
      limitType: overrideLimitType ?? limitType,
      limit: String(overrideLimit ?? limit),
    })
    if (moduleId) params.set('module', moduleId)
    router.push(`/study?${params.toString()}`)
  }

  function handleLimitTypeChange(type: 'time' | 'count') {
    setLimitType(type)
    setLimit(10)
  }

  return (
    <div className="border border-l-4 border-l-orange-500 rounded-xl bg-card overflow-hidden">
      <div className="p-6 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sprint</p>
          {open ? (
            <button
              onClick={() => setOpen(false)}
              aria-label="Close sprint config"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <Zap className="h-5 w-5 text-orange-500" />
          )}
        </div>

        {/* Collapsed state — hidden via aria-hidden when open */}
        <div
          aria-hidden={open}
          className={`transition-all duration-200 ease-in-out overflow-hidden ${
            open ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-40 opacity-100'
          }`}
        >
          <p className="text-xl font-bold mb-3">
            {dueCount > 0
              ? `${dueCount} concept${dueCount !== 1 ? 's' : ''} due — sprint through them`
              : 'Focus in a fixed time slot'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleStartSprint('time', 10)}
              className="flex-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full px-4 py-2.5 hover:bg-primary/90 active:scale-95 transition-transform"
            >
              Sprint 10 min →
            </button>
            <button
              onClick={() => setOpen(true)}
              className="text-sm font-semibold border border-border rounded-full px-4 py-2.5 hover:bg-muted/50 transition-colors whitespace-nowrap"
            >
              Customise ↓
            </button>
          </div>
        </div>

        {/* Expanded config panel — hidden via aria-hidden when closed */}
        <div
          aria-hidden={!open}
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="space-y-4 pt-1">
            {/* Module filter */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Module (optional)
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setModuleId('')}
                  className={`px-3 py-2.5 min-h-[44px] rounded-full text-xs font-semibold border transition-colors duration-200 ${
                    moduleId === ''
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  All
                </button>
                {modules.map((m) => {
                  const due = dueCountByModule[m.id] ?? 0
                  const isSelected = moduleId === m.id
                  const isEmpty = due === 0 && Object.keys(dueCountByModule).length > 0
                  return (
                    <button
                      key={m.id}
                      onClick={() => !isEmpty && setModuleId(m.id)}
                      className={`px-3 py-2.5 min-h-[44px] rounded-full text-xs font-semibold border transition-colors duration-200 ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500'
                          : isEmpty
                          ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {m.title}{due > 0 ? ` · ${due}` : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Segmented control */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Limit by</p>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => handleLimitTypeChange('time')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors duration-200 ${
                    limitType === 'time'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Timer className="h-3.5 w-3.5" />
                  Time
                </button>
                <button
                  onClick={() => handleLimitTypeChange('count')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors duration-200 ${
                    limitType === 'count'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Hash className="h-3.5 w-3.5" />
                  Exercises
                </button>
              </div>
            </div>

            {/* Value chips */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {limitType === 'time' ? 'Duration' : 'Count'}
              </p>
              <div className="flex gap-2 flex-wrap items-start">
                {(limitType === 'time' ? TIME_OPTIONS : COUNT_OPTIONS).map((val) => (
                  <div key={val} className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => setLimit(val)}
                      className={`px-4 py-2.5 min-h-[44px] rounded-full text-xs font-semibold border transition-colors duration-200 ${
                        limit === val
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {limitType === 'time' ? `${val} min` : val}
                    </button>
                    {limitType === 'time' && val === 10 && (
                      <span className="text-[10px] text-orange-500 font-semibold">Recommended</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={() => handleStartSprint()}
              className="w-full bg-primary text-primary-foreground text-sm font-semibold rounded-full px-4 py-2.5 hover:bg-primary/90 active:scale-95 transition-transform"
            >
              Start Sprint →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
