import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import type { Concept } from '@/lib/supabase/types'

interface Props {
  userId: string
  isNewUser: boolean
  thisWeekStart: string // ISO string — kept for future use; not used in current queries
  lastWeekStart: string // ISO string — kept for future use; not used in current queries
}

type ModuleRow   = { id: string; title: string; order_index: number }
type UnitRow     = { id: string; module_id: string }
type ConceptRow  = { id: string; unit_id: string }
type ProgressRow = { concept_id: string; interval_days: number }
type ModuleState = 'mastered' | 'active' | 'upcoming'

interface ModuleSummary {
  title: string
  state: ModuleState
}

export async function DashboardDeferredSection({
  userId,
  isNewUser,
  thisWeekStart,
  lastWeekStart,
}: Props) {
  const supabase = await createClient()

  // Batch 1 — weakest concept for Escritura Libre suggestion
  const weakestProgressRes = await supabase
    .from('user_progress')
    .select('concept_id, interval_days')
    .eq('user_id', userId)
    .lt('interval_days', MASTERY_THRESHOLD)
    .order('interval_days', { ascending: true })
    .limit(1)

  const weakestConceptId =
    (weakestProgressRes.data?.[0] as { concept_id: string } | undefined)?.concept_id ?? null

  // Batch 2 — write concept lookup
  const writeConceptRes = !isNewUser && weakestConceptId
    ? await supabase.from('concepts').select('id, title').eq('id', weakestConceptId).single()
    : { data: null, error: null }

  const writeConcept = writeConceptRes.data as Pick<Concept, 'id' | 'title'> | null

  // Batch 3 — curriculum state (3 public reads + 1 user read, all parallel)
  const [modulesRes, unitsRes, conceptsRes, allProgressRes] = await Promise.all([
    supabase.from('modules').select('id, title, order_index').order('order_index', { ascending: true }),
    supabase.from('units').select('id, module_id'),
    supabase.from('concepts').select('id, unit_id'),
    supabase.from('user_progress').select('concept_id, interval_days').eq('user_id', userId),
  ])

  const allModules   = (modulesRes.data   ?? []) as ModuleRow[]
  const allUnits     = (unitsRes.data     ?? []) as UnitRow[]
  const allConcepts  = (conceptsRes.data  ?? []) as ConceptRow[]
  const allProgress  = (allProgressRes.data ?? []) as ProgressRow[]

  // Build lookup maps (no join syntax)
  const unitsByModule = new Map<string, string[]>()
  for (const u of allUnits) {
    const arr = unitsByModule.get(u.module_id) ?? []
    arr.push(u.id)
    unitsByModule.set(u.module_id, arr)
  }

  const conceptsByUnit = new Map<string, string[]>()
  for (const c of allConcepts) {
    const arr = conceptsByUnit.get(c.unit_id) ?? []
    arr.push(c.id)
    conceptsByUnit.set(c.unit_id, arr)
  }

  const progressMap = new Map<string, number>()
  for (const p of allProgress) {
    progressMap.set(p.concept_id, p.interval_days)
  }

  const moduleSummaries: ModuleSummary[] = allModules.map((mod) => {
    const unitIds = unitsByModule.get(mod.id) ?? []
    const conceptIds = unitIds.flatMap((uid) => conceptsByUnit.get(uid) ?? [])
    let mastered = 0
    let studied = 0
    for (const cid of conceptIds) {
      const days = progressMap.get(cid)
      if (days !== undefined) {
        studied++
        if (days >= MASTERY_THRESHOLD) mastered++
      }
    }
    const total = conceptIds.length
    const state: ModuleState =
      total > 0 && mastered === total ? 'mastered'
      : studied > 0 ? 'active'
      : 'upcoming'
    return { title: mod.title, state }
  })

  return (
    <>
      {/* Escritura Libre card */}
      {!isNewUser && writeConcept && (
        <div className="senda-card space-y-3 relative overflow-hidden">
          {/* Quill icon — top-right decorative mark */}
          <svg
            style={{ position: 'absolute', top: 16, right: 16, pointerEvents: 'none', opacity: 0.25 }}
            width={28} height={28} viewBox="0 0 24 24" fill="none"
            aria-hidden="true"
          >
            <path d="M20.707 5.826l-2.534-2.533a1 1 0 0 0-1.414 0L3 17.05V21h3.95L20.707 7.24a1 1 0 0 0 0-1.414z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 7l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="senda-heading text-base">
            Escritura Libre
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
            Expresa tus ideas. Sin límites, solo práctica.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--d5-muted)' }}>
            Concepto sugerido: {writeConcept.title}
          </p>
          <Link href={`/write?suggested=${writeConcept.id}`} className="senda-cta-outline w-full">
            Empezar a Escribir
          </Link>
          <Button asChild variant="ghost" className="w-full text-xs h-8" style={{ color: 'var(--d5-muted)' }}>
            <Link href="/write">Cambiar Concepto</Link>
          </Button>
        </div>
      )}
      {!isNewUser && !writeConcept && (
        <div className="senda-card space-y-3 relative overflow-hidden">
          {/* Quill icon — top-right decorative mark */}
          <svg
            style={{ position: 'absolute', top: 16, right: 16, pointerEvents: 'none', opacity: 0.25 }}
            width={28} height={28} viewBox="0 0 24 24" fill="none"
            aria-hidden="true"
          >
            <path d="M20.707 5.826l-2.534-2.533a1 1 0 0 0-1.414 0L3 17.05V21h3.95L20.707 7.24a1 1 0 0 0 0-1.414z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 7l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="senda-heading text-base">
            Escritura Libre
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
            Expresa tus ideas. Sin límites, solo práctica.
          </p>
          <Link href="/write" className="senda-cta-outline w-full">
            Empezar a Escribir
          </Link>
        </div>
      )}


      {/* Tu Currículo — module progress list */}
      {moduleSummaries.length > 0 && (
        <>
          <WindingPathSeparator />
          <div>
            <p className="senda-eyebrow mb-2.5">Tu Currículo</p>
            {moduleSummaries.map((mod, i) => {
              const isUpcoming = mod.state === 'upcoming'
              const stateLabel =
                mod.state === 'mastered' ? 'Completado'
                : mod.state === 'active' ? 'En Progreso'
                : 'Próximamente'
              return (
                <div
                  key={mod.title}
                  className="flex items-center justify-between py-3"
                >
                  <span
                    className={`flex-1 mr-2 text-sm truncate ${isUpcoming ? 'text-[var(--d5-muted)]' : 'text-foreground'}`}
                  >
                    {mod.title}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                      mod.state === 'mastered' ? 'bg-[var(--d5-cream)] dark:bg-[rgba(140,106,63,0.12)]'
                      : mod.state === 'upcoming' ? 'bg-[rgba(232,230,225,0.5)] dark:bg-[rgba(140,106,63,0.08)]'
                      : ''
                    }`}
                    style={{
                      ...(mod.state === 'active' ? { background: 'var(--d5-terracotta)' } : {}),
                      color:
                        mod.state === 'mastered' ? 'var(--d5-warm)'
                        : mod.state === 'active' ? 'var(--d5-paper)'
                        : 'var(--d5-muted)',
                    }}
                  >
                    {stateLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

export function DashboardDeferredSkeleton() {
  return (
    <>
      <div className="animate-senda-pulse senda-skeleton-fill rounded-[20px] h-24" />
      <WindingPathSeparator />
      <div className="animate-senda-pulse senda-skeleton-fill rounded-[20px] h-36" />
      <WindingPathSeparator />
      <div className="animate-senda-pulse senda-skeleton-fill rounded-[20px] h-36" />
    </>
  )
}
