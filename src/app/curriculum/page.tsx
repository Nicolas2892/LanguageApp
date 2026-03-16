import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeUnlockedLevels } from '@/lib/curriculum/prerequisites'
import { CurriculumClient } from './CurriculumClient'

type ModuleRow  = { id: string; title: string; order_index: number }
type UnitRow    = { id: string; module_id: string; title: string; order_index: number }
type ConceptRow = { id: string; unit_id: string; title: string; difficulty: number; level: string | null; grammar_focus: string | null }
type ProgressRow = { concept_id: string; interval_days: number; is_hard: boolean; production_mastered: boolean }

export default async function CurriculumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [modulesRes, unitsRes, conceptsRes, progressRes, unlockedLevels] = await Promise.all([
    supabase.from('modules').select('id, title, order_index').order('order_index'),
    supabase.from('units').select('id, module_id, title, order_index').order('order_index'),
    supabase.from('concepts').select('id, unit_id, title, difficulty, level, grammar_focus').order('difficulty'),
    supabase.from('user_progress').select('concept_id, interval_days, is_hard, production_mastered').eq('user_id', user.id),
    computeUnlockedLevels(supabase, user.id),
  ])

  return (
    <CurriculumClient
      modules={(modulesRes.data ?? []) as ModuleRow[]}
      units={(unitsRes.data ?? []) as UnitRow[]}
      concepts={(conceptsRes.data ?? []) as ConceptRow[]}
      progressEntries={((progressRes.data ?? []) as ProgressRow[])}
      unlockedLevelsList={Array.from(unlockedLevels)}
    />
  )
}
