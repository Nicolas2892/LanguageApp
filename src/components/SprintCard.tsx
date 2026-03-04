'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Timer, Hash } from 'lucide-react'

interface Module {
  id: string
  title: string
}

interface Props {
  dueCount: number
  modules: Module[]
}

const TIME_OPTIONS = [5, 10, 15] as const
const COUNT_OPTIONS = [5, 10, 15, 20] as const

export function SprintCard({ dueCount, modules }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [limitType, setLimitType] = useState<'time' | 'count'>('time')
  const [limit, setLimit] = useState(10)
  const [moduleId, setModuleId] = useState('')

  function handleStartSprint() {
    const params = new URLSearchParams({
      mode: 'sprint',
      limitType,
      limit: String(limit),
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
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sprint</p>
          <Zap className="h-5 w-5 text-muted-foreground" />
        </div>

        {!open ? (
          <>
            <p className="text-xl font-bold">
              {dueCount > 0
                ? `${dueCount} concept${dueCount !== 1 ? 's' : ''} due — sprint through them`
                : 'Focus in a fixed time slot'}
            </p>
            <button
              onClick={() => setOpen(true)}
              className="w-full text-sm font-semibold border border-border rounded-full px-4 py-2 hover:bg-muted/50 transition-colors"
            >
              Configure sprint ↓
            </button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Module filter */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Module (optional)
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setModuleId('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    moduleId === ''
                      ? 'bg-orange-100 text-orange-700 border-orange-300'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  All
                </button>
                {modules.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModuleId(m.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      moduleId === m.id
                        ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Segmented control */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Limit by</p>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => handleLimitTypeChange('time')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
                    limitType === 'time'
                      ? 'bg-orange-500 text-white'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Timer className="h-3.5 w-3.5" />
                  Time
                </button>
                <button
                  onClick={() => handleLimitTypeChange('count')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
                    limitType === 'count'
                      ? 'bg-orange-500 text-white'
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
              <div className="flex gap-2 flex-wrap">
                {(limitType === 'time' ? TIME_OPTIONS : COUNT_OPTIONS).map((val) => (
                  <button
                    key={val}
                    onClick={() => setLimit(val)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      limit === val
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {limitType === 'time' ? `${val} min` : val}
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStartSprint}
              className="w-full bg-primary text-primary-foreground text-sm font-semibold rounded-full px-4 py-2.5 hover:bg-primary/90 active:scale-95 transition-transform"
            >
              Start Sprint →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
