import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** English-style Title Case for Spanish concept titles.
 *  Capitalises the first letter of each word except common minor words
 *  (articles, short prepositions, conjunctions) unless they start the string. */
const MINOR = new Set([
  'a', 'al', 'de', 'del', 'el', 'en', 'la', 'las', 'lo', 'los', 'un', 'una',
  'y', 'e', 'o', 'u', 'vs', 'vs.', 'con', 'por', 'que', 'sin',
])

export function toTitleCase(str: string): string {
  return str.replace(/\S+/g, (word, offset) => {
    // Always capitalise the first word
    if (offset === 0) return word.charAt(0).toUpperCase() + word.slice(1)
    // Don't touch words inside parentheses that start with + or are all-caps abbreviations
    if (word.startsWith('+') || word.startsWith('(+')) return word
    const lower = word.toLowerCase()
    if (MINOR.has(lower)) return lower
    return word.charAt(0).toUpperCase() + word.slice(1)
  })
}

export function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email[0].toUpperCase()
}
