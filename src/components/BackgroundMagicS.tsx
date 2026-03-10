// Large watermark S-path — positioned absolute, behind the Open Practice card.
// Parent must be position: relative and overflow: hidden.
export function BackgroundMagicS({ opacity = 0.07 }: { opacity?: number }) {
  return (
    <svg
      viewBox="0 0 200 260"
      width={200}
      height={260}
      style={{ position: 'absolute', right: -30, top: -10, opacity, pointerEvents: 'none' }}
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
