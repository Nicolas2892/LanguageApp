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
  if (wrongAttempts === 0) return null

  return (
    <div className="space-y-2 text-sm">
      {wrongAttempts >= 1 && hint1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-900">
          <span className="font-semibold">Hint: </span>{hint1}
        </div>
      )}
      {wrongAttempts >= 2 && hint2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-900">
          <span className="font-semibold">Extra hint: </span>{hint2}
        </div>
      )}
      {wrongAttempts >= 2 && !claudeHint && !loadingHint && (
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
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-900">
          <span className="font-semibold">Worked example: </span>{claudeHint}
        </div>
      )}
    </div>
  )
}
