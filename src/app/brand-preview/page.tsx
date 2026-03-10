import { Cormorant_Garamond, DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import {
  BrandPreviewClient,
  type D5Data,
  type D5ModuleData,
  type D5ProgressData,
  type D5ConceptData,
  type D5VerbData,
} from './BrandPreviewClient'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant',
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
  variable: '--font-dm-serif',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
})

const TENSE_LABELS_MAP: Record<string, string> = {
  present_indicative:      'Presente de Indicativo',
  preterite:               'Pretérito Indefinido',
  imperfect:               'Pretérito Imperfecto',
  future:                  'Futuro Simple',
  conditional:             'Condicional Simple',
  present_subjunctive:     'Presente de Subjuntivo',
  imperfect_subjunctive:   'Pretérito Imp. de Subjuntivo',
  imperative_affirmative:  'Imperativo Afirmativo',
  imperative_negative:     'Imperativo Negativo',
}

const TENSES_ORDER = [
  'present_indicative', 'preterite', 'imperfect', 'future', 'conditional',
  'present_subjunctive', 'imperfect_subjunctive', 'imperative_affirmative', 'imperative_negative',
]

export default async function BrandPreviewPage() {
  let d5Data:         D5Data         | null = null
  let d5ProgressData: D5ProgressData | null = null
  let d5ConceptData:  D5ConceptData  | null = null
  let d5VerbData:     D5VerbData     | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const today = new Date().toISOString().split('T')[0]

      // ── Batch 1: 12 parallel queries ──────────────────────────────────────────
      const [
        profileRes, dueRes, totalConceptsRes, masteredRes,
        modulesRes, unitsRes, conceptsRes, progressRes,
        attemptsRes, sessionsRes, verbProgressRes, firstVerbRes,
      ] = await Promise.all([
        supabase.from('profiles')
          .select('display_name, computed_level, streak')
          .eq('id', user.id).single(),
        supabase.from('user_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).lte('due_date', today),
        supabase.from('concepts')
          .select('id', { count: 'exact', head: true }),
        supabase.from('user_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('interval_days', MASTERY_THRESHOLD),
        supabase.from('modules').select('id, title').order('order_index'),
        supabase.from('units').select('id, module_id'),
        supabase.from('concepts').select('id, unit_id, title, level, explanation'),
        supabase.from('user_progress')
          .select('concept_id, interval_days')
          .eq('user_id', user.id),
        supabase.from('exercise_attempts')
          .select('ai_score')
          .eq('user_id', user.id),
        supabase.from('study_sessions')
          .select('started_at, ended_at')
          .eq('user_id', user.id),
        supabase.from('verb_progress')
          .select('tense, attempt_count, correct_count')
          .eq('user_id', user.id)
          .gt('attempt_count', 0),
        supabase.from('verbs')
          .select('id, infinitive, english, verb_group')
          .order('frequency_rank', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ])

      type ModuleRow   = { id: string; title: string }
      type UnitRow     = { id: string; module_id: string }
      type ConceptRow  = { id: string; unit_id: string; title: string; level: string; explanation: string }
      type ProgressRow = { concept_id: string; interval_days: number }
      type AttemptRow  = { ai_score: number | null }
      type SessionRow  = { started_at: string; ended_at: string | null }
      type VerbProgressRow = { tense: string; attempt_count: number; correct_count: number }
      type VerbRow     = { id: string; infinitive: string; english: string; verb_group: string }

      const profile      = profileRes.data as { display_name: string | null; computed_level: string | null; streak: number | null } | null
      const modules      = (modulesRes.data ?? []) as ModuleRow[]
      const units        = (unitsRes.data ?? []) as UnitRow[]
      const concepts     = (conceptsRes.data ?? []) as ConceptRow[]
      const progressRows = (progressRes.data ?? []) as ProgressRow[]
      const firstVerb    = firstVerbRes.data as VerbRow | null

      // ── Derived lookups ──────────────────────────────────────────────────────
      const unitToModule = new Map(units.map(u => [u.id, u.module_id]))
      const progressMap  = new Map(progressRows.map(p => [p.concept_id, p.interval_days]))
      const conceptMap   = new Map(concepts.map(c => [c.id, c]))

      // ── Per-module stats for D5Data ──────────────────────────────────────────
      const moduleStats = new Map<string, { total: number; mastered: number; studied: number }>()
      for (const mod of modules) moduleStats.set(mod.id, { total: 0, mastered: 0, studied: 0 })
      for (const concept of concepts) {
        const moduleId = unitToModule.get(concept.unit_id)
        if (!moduleId) continue
        const stats = moduleStats.get(moduleId)
        if (!stats) continue
        stats.total++
        const iv = progressMap.get(concept.id)
        if (iv !== undefined) {
          stats.studied++
          if (iv >= MASTERY_THRESHOLD) stats.mastered++
        }
      }

      let foundActive = false
      const d5Modules: D5ModuleData[] = modules.map(mod => {
        const stats = moduleStats.get(mod.id) ?? { total: 0, mastered: 0, studied: 0 }
        let state: D5ModuleData['state']
        if (stats.total > 0 && stats.mastered === stats.total) {
          state = 'mastered'
        } else if (!foundActive && stats.studied > 0) {
          state = 'active'
          foundActive = true
        } else {
          state = 'upcoming'
        }
        return { title: mod.title, state, ...stats }
      })

      // ── writeConcept (weakest in-progress concept) ──────────────────────────
      const conceptsByLevel = new Map(concepts.map(c => [c.id, c.level]))
      const weakestProgress = progressRows
        .filter(p => p.interval_days > 0 && p.interval_days < MASTERY_THRESHOLD)
        .sort((a, b) => a.interval_days - b.interval_days)[0]
      const writeConceptRow = weakestProgress ? (conceptMap.get(weakestProgress.concept_id) ?? null) : null
      const writeConcept    = writeConceptRow ? { id: writeConceptRow.id, title: writeConceptRow.title } : null

      d5Data = {
        displayName:   profile?.display_name   ?? 'Estudiante',
        level:         profile?.computed_level  ?? 'B1',
        dueCount:      dueRes.count             ?? 0,
        totalConcepts: totalConceptsRes.count   ?? 0,
        masteredCount: masteredRes.count        ?? 0,
        modules:       d5Modules,
        writeConcept,
      }

      // ── D5ProgressData ───────────────────────────────────────────────────────
      const allAttempts  = (attemptsRes.data ?? []) as AttemptRow[]
      const totalAttempts  = allAttempts.length
      const correctAttempts = allAttempts.filter(r => (r.ai_score ?? 0) >= 2).length
      const overallAccuracy = totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 100) : 0

      const allSessions  = (sessionsRes.data ?? []) as SessionRow[]
      const totalMinutes = allSessions.reduce((sum, s) => {
        if (!s.ended_at) return sum
        return sum + Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
      }, 0)

      // CEFR breakdown using concepts.level + progressMap
      const levelTotal   = new Map<string, number>()
      const levelMastered = new Map<string, number>()
      for (const c of concepts) {
        levelTotal.set(c.level, (levelTotal.get(c.level) ?? 0) + 1)
        const iv = progressMap.get(c.id)
        if (iv !== undefined && iv >= MASTERY_THRESHOLD) {
          levelMastered.set(c.level, (levelMastered.get(c.level) ?? 0) + 1)
        }
      }
      const cefrData = ['B1', 'B2', 'C1'].map(level => ({
        level,
        mastered: levelMastered.get(level) ?? 0,
        total:    levelTotal.get(level)    ?? 0,
      }))

      // Verb tense mastery aggregated across all verbs
      const verbTenseMap = new Map<string, { correct: number; attempts: number }>()
      for (const row of (verbProgressRes.data ?? []) as VerbProgressRow[]) {
        const e = verbTenseMap.get(row.tense) ?? { correct: 0, attempts: 0 }
        e.attempts += row.attempt_count
        e.correct  += row.correct_count
        verbTenseMap.set(row.tense, e)
      }
      const tenseMastery = Array.from(verbTenseMap.entries())
        .map(([tense, { correct, attempts }]) => ({
          tense,
          label:    TENSE_LABELS_MAP[tense] ?? tense,
          pct:      Math.round((correct / attempts) * 100),
          attempts,
        }))
        .sort((a, b) => a.pct - b.pct)

      d5ProgressData = {
        streak:         profile?.streak         ?? 0,
        masteredCount:  masteredRes.count        ?? 0,
        totalConcepts:  totalConceptsRes.count   ?? 0,
        level:          profile?.computed_level  ?? 'B1',
        overallAccuracy,
        totalAttempts,
        totalMinutes,
        cefrData,
        tenseMastery,
      }

      // ── Batch 2: verb conjugations + exercises for concept ───────────────────
      const [verbConjRes, verbProgForVerbRes, conceptExercisesRes] = await Promise.all([
        firstVerb
          ? supabase.from('verb_conjugations')
              .select('tense, stem, yo, tu, el, nosotros, vosotros, ellos')
              .eq('verb_id', firstVerb.id)
          : Promise.resolve({ data: [] }),
        firstVerb
          ? supabase.from('verb_progress')
              .select('tense, attempt_count, correct_count')
              .eq('user_id', user.id)
              .eq('verb_id', firstVerb.id)
          : Promise.resolve({ data: [] }),
        writeConceptRow
          ? supabase.from('exercises')
              .select('id, type, prompt')
              .eq('concept_id', writeConceptRow.id)
              .limit(6)
          : Promise.resolve({ data: [] }),
      ])

      // ── D5ConceptData ────────────────────────────────────────────────────────
      if (writeConceptRow) {
        type ExerciseRow = { id: string; type: string; prompt: string }
        d5ConceptData = {
          id:          writeConceptRow.id,
          title:       writeConceptRow.title,
          explanation: writeConceptRow.explanation ?? '',
          level:       writeConceptRow.level,
          intervalDays: weakestProgress!.interval_days,
          exercises:   (conceptExercisesRes.data ?? []) as ExerciseRow[],
        }
      }

      // ── D5VerbData ───────────────────────────────────────────────────────────
      if (firstVerb) {
        type ConjRow    = { tense: string; stem: string; yo: string; tu: string; el: string; nosotros: string; vosotros: string; ellos: string }
        type VPRow      = { tense: string; attempt_count: number; correct_count: number }
        const conjRows  = (verbConjRes.data ?? []) as ConjRow[]
        const vpRows    = (verbProgForVerbRes.data ?? []) as VPRow[]
        const vpMap     = new Map(vpRows.map(p => [p.tense, p]))

        d5VerbData = {
          infinitive: firstVerb.infinitive,
          english:    firstVerb.english,
          tenseData:  TENSES_ORDER.map(tense => {
            const conj = conjRows.find(c => c.tense === tense)
            const rows = conj ? [
              { pronoun: 'yo',       form: conj.yo       },
              { pronoun: 'tú',       form: conj.tu       },
              { pronoun: 'él/ella',  form: conj.el       },
              { pronoun: 'nosotros', form: conj.nosotros },
              { pronoun: 'vosotros', form: conj.vosotros },
              { pronoun: 'ellos',    form: conj.ellos    },
            ] : []
            const vp = vpMap.get(tense)
            const masteryPct = vp && vp.attempt_count > 0
              ? Math.round((vp.correct_count / vp.attempt_count) * 100) : null
            return {
              tense,
              label:      TENSE_LABELS_MAP[tense] ?? tense,
              rows,
              masteryPct,
              attempts:   vp?.attempt_count ?? 0,
              stem:       conj?.stem ?? '',
            }
          }),
        }
      }

      // suppress unused warning
      void conceptsByLevel
    }
  } catch {
    // Not authenticated or fetch failed — all data stays null, components use fallback mockup values
  }

  return (
    <div className={`${cormorant.variable} ${dmSerif.variable} ${plusJakarta.variable}`}>
      <BrandPreviewClient
        d5Data={d5Data}
        d5ProgressData={d5ProgressData}
        d5ConceptData={d5ConceptData}
        d5VerbData={d5VerbData}
      />
    </div>
  )
}
