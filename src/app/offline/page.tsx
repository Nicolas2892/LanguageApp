'use client'

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'oklch(0.992 0.002 80)', fontFamily: 'system-ui, sans-serif' }}>

      {/* Large S-path watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <svg viewBox="0 0 300 390" width={300} height={390} style={{ opacity: 0.04 }}>
          <path
            d="M 120 345 C 30 330, 0 278, 42 237 C 84 196, 195 207, 237 165 C 279 123, 288 63, 237 30"
            stroke="oklch(0.41 0.11 142)"
            strokeWidth={66}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-xs">

        {/* Logo mark — calligraphic fill */}
        <svg viewBox="0 0 24 24" width={32} height={32} aria-hidden="true">
          <path
            d="M 5.2 21 C 1 19.5, -0.8 14.5, 2.5 11 C 5.8 7.5, 14.2 9.8, 17.2 7 C 20.2 4.2, 20.8 0.5, 17.8 0.8 C 16.5 0.2, 15.8 2.2, 17 3.2 C 21 1.5, 21.5 5.8, 18.8 8.8 C 16 12, 7.5 9.5, 5 12.5 C 2.5 15.5, 4 19, 7.2 20 C 8.5 21, 7 21.5, 5.2 21 Z"
            fill="oklch(0.41 0.11 142)"
          />
        </svg>

        {/* Winding path separator */}
        <svg viewBox="0 0 200 16" width={160} height={16} aria-hidden="true">
          <path
            d="M 2 11 C 30 4, 65 14, 100 9 C 133 4, 168 13, 198 7"
            stroke="oklch(0.556 0 0)"
            strokeWidth={1}
            strokeLinecap="round"
            fill="none"
            opacity={0.35}
          />
        </svg>

        {/* Heading — serif italic */}
        <h1 style={{
          fontFamily: 'var(--font-lora), Georgia, serif',
          fontStyle: 'italic',
          fontSize: '1.75rem',
          fontWeight: 400,
          lineHeight: 1.2,
          color: 'oklch(0.145 0 0)',
          margin: 0,
        }}>
          Tu senda te espera.
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed" style={{ maxWidth: 260 }}>
          Reconéctate para continuar tu camino.
        </p>

        {/* Winding path separator */}
        <svg viewBox="0 0 200 16" width={160} height={16} aria-hidden="true">
          <path
            d="M 2 11 C 30 4, 65 14, 100 9 C 133 4, 168 13, 198 7"
            stroke="oklch(0.556 0 0)"
            strokeWidth={1}
            strokeLinecap="round"
            fill="none"
            opacity={0.35}
          />
        </svg>

        {/* Reload button */}
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary text-primary-foreground px-8 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>

      </div>
    </main>
  )
}
