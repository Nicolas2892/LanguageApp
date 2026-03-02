export const SCORE_CONFIG = {
  3: { label: 'Perfect', className: 'bg-green-100 text-green-800 border-green-200' },
  2: { label: 'Good', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  1: { label: 'Needs work', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  0: { label: 'Incorrect', className: 'bg-red-100 text-red-800 border-red-200' },
} as const

export type SRSScoreKey = keyof typeof SCORE_CONFIG
