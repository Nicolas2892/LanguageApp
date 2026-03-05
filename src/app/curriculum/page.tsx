import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import { LevelChip } from '@/components/LevelChip'
import { MASTERY_THRESHOLD, LEVEL_CHIP } from '@/lib/constants'
import { Trophy, ChevronRight } from 'lucide-react'

type MasteryState = 'mastered' | 'learning' | 'new'
type FilterTab = 'all' | 'new' | 'learning' | 'mastered'
type LevelFilter = 'all' | 'B1' | 'B2' | 'C1'

function getMasteryState(intervalDays: number | undefined): MasteryState {
  if (intervalDays === undefined) return 'new'
  if (intervalDays >= MASTERY_THRESHOLD) return 'mastered'
  return 'learning'
}

const MASTERY_BADGE: Record<MasteryState, { label: string; className: string }> = {
  mastered: { label: 'Mastered', className: 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' },
  learning: { label: 'Learning', className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 border-blue-100 dark:border-blue-800' },
  new:      { label: 'New',      className: 'bg-transparent text-muted-foreground border-border' },
}

function DifficultyBars({ difficulty }: { difficulty: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-3 rounded-full ${i <= difficulty ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}
        />
      ))}
    </div>
  )
}

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'new',      label: 'New' },
  { value: 'learning', label: 'Learning' },
  { value: 'mastered', label: 'Mastered' },
]

const EMPTY_STATE: Record<Exclude<FilterTab, 'all'>, string> = {
  new:      "You've started every concept. Keep going!",
  learning: 'No concepts in progress yet — start a study session!',
  mastered: 'No concepts mastered yet — keep practising!',
}

interface Props {
  searchParams: Promise<{ filter?: string; level?: string }>
}

export default async function CurriculumPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { filter: rawFilter, level: rawLevel } = await searchParams
  const filter: FilterTab = (['all', 'new', 'learning', 'mastered'].includes(rawFilter ?? '')
    ? rawFilter
    : 'all') as FilterTab
  const levelFilter: LevelFilter = (['all', 'B1', 'B2', 'C1'].includes(rawLevel ?? '')
    ? rawLevel
    : 'all') as LevelFilter

  const [modulesRes, unitsRes, conceptsRes, progressRes] = await Promise.all([
    supabase.from('modules').select('id, title, order_index').order('order_index'),
    supabase.from('units').select('id, module_id, title, order_index').order('order_index'),
    supabase.from('concepts').select('id, unit_id, title, difficulty, level, grammar_focus').order('difficulty'),
    supabase.from('user_progress').select('concept_id, interval_days').eq('user_id', user.id),
  ])

  type ModuleRow  = { id: string; title: string; order_index: number }
  type UnitRow    = { id: string; module_id: string; title: string; order_index: number }
  type ConceptRow = { id: string; unit_id: string; title: string; difficulty: number; level: string | null; grammar_focus: string | null }
  type ProgressRow = { concept_id: string; interval_days: number }

  const typedModules  = (modulesRes.data  ?? []) as ModuleRow[]
  const typedUnits    = (unitsRes.data    ?? []) as UnitRow[]
  const typedConcepts = (conceptsRes.data ?? []) as ConceptRow[]
  const progressMap   = new Map(((progressRes.data ?? []) as ProgressRow[]).map((p) => [p.concept_id, p.interval_days]))

  const unitsByModule  = new Map<string, UnitRow[]>()
  const conceptsByUnit = new Map<string, ConceptRow[]>()
  for (const u of typedUnits) {
    const arr = unitsByModule.get(u.module_id) ?? []; arr.push(u); unitsByModule.set(u.module_id, arr)
  }
  for (const c of typedConcepts) {
    const arr = conceptsByUnit.get(c.unit_id) ?? []; arr.push(c); conceptsByUnit.set(c.unit_id, arr)
  }

  function matchesFilter(conceptId: string): boolean {
    const intervalDays = progressMap.get(conceptId)
    if (filter === 'all')      return true
    if (filter === 'new')      return intervalDays === undefined
    if (filter === 'learning') return intervalDays !== undefined && intervalDays < MASTERY_THRESHOLD
    if (filter === 'mastered') return intervalDays !== undefined && intervalDays >= MASTERY_THRESHOLD
    return true
  }

  function matchesLevel(concept: ConceptRow): boolean {
    if (levelFilter === 'all') return true
    return concept.level === levelFilter
  }

  const anyMatch = typedConcepts.some((c) => matchesFilter(c.id) && matchesLevel(c))

  const backParts: string[] = []
  if (filter !== 'all') backParts.push(`filter=${filter}`)
  if (levelFilter !== 'all') backParts.push(`level=${levelFilter}`)
  const backFilter = backParts.length > 0 ? `?${backParts.join('&')}` : ''

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Curriculum</h1>
        <p className="text-sm text-muted-foreground mt-0.5">B1 → B2 Spanish</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {FILTER_TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={value === 'all' ? '/curriculum' : `/curriculum?filter=${value}`}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === value
                ? 'border-orange-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Level filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'B1', 'B2', 'C1'] as LevelFilter[]).map((lvl) => {
          const isActive = levelFilter === lvl
          const href = (() => {
            const parts: string[] = []
            if (filter !== 'all') parts.push(`filter=${filter}`)
            if (lvl !== 'all') parts.push(`level=${lvl}`)
            return `/curriculum${parts.length > 0 ? `?${parts.join('&')}` : ''}`
          })()
          const chip = lvl !== 'all' ? LEVEL_CHIP[lvl] : null
          return (
            <Link
              key={lvl}
              href={href}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                isActive
                  ? chip
                    ? chip.className
                    : 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground'
              }`}
            >
              {lvl === 'all' ? 'All levels' : lvl}
            </Link>
          )
        })}
      </div>

      {/* Global empty state */}
      {!anyMatch && (filter !== 'all' || levelFilter !== 'all') && (
        <div className="text-center py-12 text-muted-foreground">
          {filter !== 'all'
            ? <p className="text-base">{EMPTY_STATE[filter as Exclude<FilterTab, 'all'>]}</p>
            : <p className="text-base">No {levelFilter} concepts match the current filters.</p>
          }
        </div>
      )}

      {/* Module accordions */}
      {anyMatch && (
        <div className="space-y-3">
          {typedModules.map((mod) => {
            const modUnits       = unitsByModule.get(mod.id) ?? []
            const allModConcepts = modUnits.flatMap((u) => conceptsByUnit.get(u.id) ?? [])
            const matchingCount  = allModConcepts.filter((c) => matchesFilter(c.id) && matchesLevel(c)).length
            const masteredCount  = allModConcepts.filter(
              (c) => (progressMap.get(c.id) ?? -1) >= MASTERY_THRESHOLD
            ).length
            const masteredPct = allModConcepts.length > 0 ? (masteredCount / allModConcepts.length) * 100 : 0

            // Hide modules with no matching concepts when a filter is active
            if (filter !== 'all' && matchingCount === 0) return null

            const isOpen = matchingCount > 0

            return (
              <details key={mod.id} open={isOpen} className="group border rounded-xl bg-card shadow-sm overflow-hidden">
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 transition-transform duration-200 group-open:rotate-90 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <h2 className="text-base font-bold leading-snug">{mod.title}</h2>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-amber-500" />
                          {masteredCount}/{allModConcepts.length} mastered
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 h-8 text-xs">
                      <Link href={`/study?module=${mod.id}`}>Practice module →</Link>
                    </Button>
                  </div>
                  {/* Module progress bar */}
                  <div className="pl-6">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${masteredPct}%` }}
                      />
                    </div>
                  </div>
                </summary>

                {/* Units + concepts */}
                <div className="px-4 pb-4 pt-2 space-y-4 border-t">
                  {modUnits.map((unit) => {
                    const allUnitConcepts = conceptsByUnit.get(unit.id) ?? []
                    const unitConcepts    = allUnitConcepts.filter((c) => matchesFilter(c.id) && matchesLevel(c))
                    const unitMastered    = allUnitConcepts.filter(
                      (c) => (progressMap.get(c.id) ?? -1) >= MASTERY_THRESHOLD
                    ).length

                    if (unitConcepts.length === 0) return null

                    return (
                      <div key={unit.id} className="space-y-1.5">
                        {/* Unit header */}
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {unit.title}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {unitMastered}/{allUnitConcepts.length}
                            </span>
                          </div>
                          <Button asChild variant="ghost" size="sm" className="h-6 text-xs px-2">
                            <Link href={`/study?unit=${unit.id}`}>Practice unit →</Link>
                          </Button>
                        </div>

                        {/* Concept rows */}
                        <div className="space-y-1">
                          {unitConcepts.map((concept) => {
                            const intervalDays = progressMap.get(concept.id)
                            const state = getMasteryState(intervalDays)
                            const cfg   = MASTERY_BADGE[state]

                            return (
                              <div
                                key={concept.id}
                                className="relative border rounded-lg bg-background hover:bg-muted/40 transition-colors"
                              >
                                {/* Full-row link to detail page */}
                                <Link
                                  href={`/curriculum/${concept.id}${backFilter}`}
                                  className="absolute inset-0 rounded-lg"
                                  aria-label={`View ${concept.title}`}
                                />
                                <div className="flex items-center justify-between px-3 py-2.5 gap-2">
                                  {/* Left: title + difficulty */}
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <p className="font-medium text-sm leading-snug truncate">{concept.title}</p>
                                    <DifficultyBars difficulty={concept.difficulty} />
                                  </div>
                                  {/* Right: badges + practice shortcut */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <LevelChip level={concept.level} />
                                    <GrammarFocusChip focus={concept.grammar_focus} />
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.className}`}>
                                      {cfg.label}
                                    </span>
                                    <div className="relative z-10">
                                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                                        <Link href={`/study?concept=${concept.id}`}>Practice →</Link>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </main>
  )
}
