import type { StudyItem } from '@/app/study/StudySession'

/**
 * Cycles `items` until the result has at least `min` entries.
 * Avoids consecutive duplicates when the pool has ≥ 2 items.
 */
export function cycleToMinimum(items: StudyItem[], min: number): StudyItem[] {
  if (items.length === 0 || items.length >= min) return items
  const result: StudyItem[] = []
  let i = 0
  while (result.length < min) {
    const next = items[i % items.length]
    if (
      result.length > 0 &&
      items.length >= 2 &&
      next.exercise.id === result[result.length - 1].exercise.id
    ) {
      i++
      continue
    }
    result.push(next)
    i++
  }
  return result
}
