import type { CSSProperties } from 'react'

// Large watermark S-path — positioned absolute, behind its parent card or page section.
// Parent must be position: relative and overflow: hidden.
// Opacity and stroke colour adapt via CSS tokens --d5-magic-opacity and --d5-magic-stroke.
export function BackgroundMagicS({ opacity, style }: { opacity?: number; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 200 260"
      width={200}
      height={260}
      style={{ position: 'absolute', right: -30, top: -10, opacity: opacity ?? 'var(--d5-magic-opacity)' as unknown as number, pointerEvents: 'none', ...style }}
      aria-hidden="true"
    >
      <path
        d="M 80 230 C 20 220, 0 185, 28 158 C 56 131, 130 138, 158 110 C 186 82, 192 42, 158 20"
        stroke="var(--d5-magic-stroke)"
        strokeWidth={44}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
