export const SCORE_CONFIG = {
  3: { label: 'Perfecto', className: 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' },
  2: { label: 'Bien', className: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  1: { label: 'A mejorar', className: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' },
  0: { label: 'Incorrecto', className: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' },
} as const

export type SRSScoreKey = keyof typeof SCORE_CONFIG
