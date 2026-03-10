import type { CSSProperties } from 'react'

// Large watermark S-path — positioned absolute, behind its parent card or page section.
// Parent must be position: relative and overflow: hidden.
export function BackgroundMagicS({ opacity = 0.07, style }: { opacity?: number; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 200 260"
      width={200}
      height={260}
      style={{ position: 'absolute', right: -30, top: -10, opacity, pointerEvents: 'none', ...style }}
      aria-hidden="true"
    >
      <path
        d="M 80 230 C 20 220, 0 185, 28 158 C 56 131, 130 138, 158 110 C 186 82, 192 42, 158 20"
        stroke="var(--d5-muted)"
        strokeWidth={44}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
