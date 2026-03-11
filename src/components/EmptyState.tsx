import Link from 'next/link'

interface EmptyStateProps {
  heading: string
  subtext: string
  ctaLabel: string
  ctaHref: string
}

// Winding-path separator — matches the Senda brand SVG language
function WindingRule() {
  return (
    <svg viewBox="0 0 200 16" width={140} height={14} aria-hidden="true" className="opacity-30">
      <path
        d="M 2 11 C 30 4, 65 14, 100 9 C 133 4, 168 13, 198 7"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function EmptyState({ heading, subtext, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center text-center py-20 px-6">

      {/* Faint S-path watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <svg viewBox="0 0 300 390" width={300} height={390} className="opacity-[0.035] text-foreground">
          <path
            d="M 120 345 C 30 330, 0 278, 42 237 C 84 196, 195 207, 237 165 C 279 123, 288 63, 237 30"
            stroke="currentColor"
            strokeWidth={64}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5 max-w-xs">
        <WindingRule />

        {/* Heading — DM Serif italic */}
        <h2
          className="text-xl leading-snug text-foreground"
          style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontStyle: 'italic' }}
        >
          {heading}
        </h2>

        <p className="text-sm text-muted-foreground leading-relaxed">{subtext}</p>

        <WindingRule />

        {/* Terracotta CTA — fixed brand colour, dark-mode stable */}
        <Link
          href={ctaHref}
          className="rounded-full px-7 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 active:scale-95"
          style={{ background: '#C4522E', color: '#FDFCF9' }}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
