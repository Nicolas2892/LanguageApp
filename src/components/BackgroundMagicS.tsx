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
        d="M 57 242 C 24 230, 5 195, 14 161 C 24 126, 52 115, 86 103 C 119 92, 152 80, 171 57 C 185 40, 181 17, 162 17 C 157 17, 160 29, 166 34 C 181 23, 200 34, 195 63 C 190 92, 162 109, 128 121 C 95 132, 62 138, 43 161 C 24 184, 29 218, 52 230 C 67 239, 71 230, 57 242 Z"
        fill="var(--d5-magic-stroke)"
      />
    </svg>
  )
}
