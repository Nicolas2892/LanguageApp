'use client'

interface Props {
  hint1: string | null
  hint2: string | null
  claudeHint: string | null
  wrongAttempts: number
  loadingHint: boolean
  onRequestHint: () => void
}

export function HintPanel({ hint1, hint2, claudeHint, wrongAttempts, loadingHint, onRequestHint }: Props) {
  const hasAnyHint = !!(hint1 || hint2)
  if (!hasAnyHint) return null

  const hint1Revealed = wrongAttempts >= 1
  const hint2Revealed = wrongAttempts >= 2

  return (
    <div className="space-y-2 text-sm">
      {/* Dots indicator — always visible when hints exist */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
        <span>Hints:</span>
        {hint1 && (
          <span
            className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              hint1Revealed ? 'bg-amber-400' : 'bg-border'
            }`}
          />
        )}
        {hint2 && (
          <span
            className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              hint2Revealed ? 'bg-amber-400' : 'bg-border'
            }`}
          />
        )}
        {claudeHint && <span className="text-blue-500 ml-1">✦ Example</span>}
      </div>

      {hint1Revealed && hint1 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-amber-900 dark:text-amber-300">
          <span className="font-semibold">Hint: </span>{hint1}
        </div>
      )}
      {hint2Revealed && hint2 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-amber-900 dark:text-amber-300">
          <span className="font-semibold">Extra hint: </span>{hint2}
        </div>
      )}
      {hint2Revealed && !claudeHint && !loadingHint && (
        <button
          onClick={onRequestHint}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Show worked example
        </button>
      )}
      {loadingHint && (
        <p className="text-xs text-muted-foreground animate-pulse">Generating example…</p>
      )}
      {claudeHint && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-blue-900 dark:text-blue-300">
          <span className="font-semibold">Worked example: </span>{claudeHint}
        </div>
      )}
    </div>
  )
}
