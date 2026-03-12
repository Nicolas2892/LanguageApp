import type { Concept, Exercise } from '@/lib/supabase/types'

export interface StudyItem {
  concept: Concept
  exercise: Exercise
}

/**
 * SRS mode: pick one exercise per concept, biased away from gap_fill.
 * When underweight=true, 80% chance to exclude gap_fill from the pool
 * (falls back to full pool if concept has ONLY gap_fill exercises).
 */
export function biasedExercisePick(exercises: Exercise[], underweightGapFill: boolean): Exercise {
  if (exercises.length === 0) throw new Error('biasedExercisePick: empty exercise array')
  if (exercises.length === 1) return exercises[0]

  if (underweightGapFill && Math.random() < 0.8) {
    const nonGap = exercises.filter(e => e.type !== 'gap_fill')
    if (nonGap.length > 0) {
      return nonGap[Math.floor(Math.random() * nonGap.length)]
    }
  }

  return exercises[Math.floor(Math.random() * exercises.length)]
}

/**
 * Open Practice: randomly drop ~60% of gap_fill items from the list.
 * Returns original list if no gap_fill items exist or if all items are gap_fill.
 */
export function dropGapFillForPractice(items: StudyItem[]): StudyItem[] {
  const hasGapFill = items.some(i => i.exercise.type === 'gap_fill')
  const hasNonGapFill = items.some(i => i.exercise.type !== 'gap_fill')
  if (!hasGapFill || !hasNonGapFill) return items

  const result: StudyItem[] = []
  for (const item of items) {
    if (item.exercise.type === 'gap_fill') {
      // Keep ~40% of gap_fill items
      if (Math.random() < 0.4) result.push(item)
    } else {
      result.push(item)
    }
  }

  // Safety: ensure at least one item remains
  if (result.length === 0) return [items[0]]
  return result
}
