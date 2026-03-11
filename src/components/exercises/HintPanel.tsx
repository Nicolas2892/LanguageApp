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
      <div className="flex items-center gap-1.5 text-xs text-[var(--d5-muted)] mt-3">
        <span>Pistas:</span>
        {hint1 && (
          <span
            className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              hint1Revealed ? 'bg-[var(--d5-warm)]' : 'bg-border'
            }`}
          />
        )}
        {hint2 && (
          <span
            className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              hint2Revealed ? 'bg-[var(--d5-warm)]' : 'bg-border'
            }`}
          />
        )}
        {claudeHint && <span className="text-primary ml-1">✦ Ejemplo</span>}
      </div>

      {hint1Revealed && hint1 && (
        <div className="senda-card-sm border border-[var(--d5-pill-border)] text-foreground">
          <span className="font-semibold text-[var(--d5-warm)]">Pista: </span>{hint1}
        </div>
      )}
      {hint2Revealed && hint2 && (
        <div className="senda-card-sm border border-[var(--d5-pill-border)] text-foreground">
          <span className="font-semibold text-[var(--d5-warm)]">Pista extra: </span>{hint2}
        </div>
      )}
      {hint2Revealed && !claudeHint && !loadingHint && (
        <button
          onClick={onRequestHint}
          className="text-xs text-[var(--d5-muted)] underline hover:text-foreground"
        >
          Mostrar ejemplo resuelto
        </button>
      )}
      {loadingHint && (
        <p className="text-xs text-[var(--d5-muted)] animate-pulse">Generando ejemplo…</p>
      )}
      {claudeHint && (
        <div className="senda-card-sm border border-[var(--d5-pill-border)] text-foreground">
          <span className="font-semibold text-primary">Ejemplo resuelto: </span>{claudeHint}
        </div>
      )}
    </div>
  )
}
