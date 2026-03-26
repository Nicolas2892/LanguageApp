// D5 Celebration flourish — calligraphic S-mark with radiating warm strokes.
// Used on session done screens as the primary reward visual.

export function SvgCelebration({ size = 56 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Radiating calligraphic strokes — warm tones, varying opacity */}
      <path
        d="M 40 10 C 42 6, 44 3, 43 1"
        stroke="var(--d5-terracotta)"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.3}
      />
      <path
        d="M 56 16 C 60 12, 64 10, 66 8"
        stroke="var(--d5-terracotta)"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.25}
      />
      <path
        d="M 66 32 C 70 30, 74 30, 77 29"
        stroke="var(--d5-terracotta)"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.2}
      />
      <path
        d="M 14 16 C 10 12, 7 10, 5 9"
        stroke="var(--d5-terracotta)"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.25}
      />
      <path
        d="M 24 16 C 22 12, 19 8, 18 5"
        stroke="var(--d5-terracotta)"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.2}
      />
      <path
        d="M 14 48 C 10 50, 6 50, 3 51"
        stroke="var(--d5-terracotta)"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.2}
      />
      <path
        d="M 60 56 C 64 60, 68 62, 71 63"
        stroke="var(--d5-terracotta)"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.2}
      />
      <path
        d="M 40 70 C 39 74, 38 77, 38 79"
        stroke="var(--d5-terracotta)"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.15}
      />

      {/* Central S-mark — refined stroke, scaled to center of viewBox */}
      <g transform="translate(24, 22) scale(1.35)">
        <path
          d="M 7 20 C 4 18, 1 15, 4 12 C 7 9, 14 9.5, 18 8 C 20.5 5.5, 20 1.5, 16.5 2.5"
          stroke="var(--d5-terracotta)"
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Accent dots — three small circles like ink drops */}
      <circle cx="26" cy="24" r="1.5" fill="var(--d5-terracotta)" opacity={0.35} />
      <circle cx="58" cy="42" r="1.2" fill="var(--d5-terracotta)" opacity={0.3} />
      <circle cx="34" cy="62" r="1" fill="var(--d5-terracotta)" opacity={0.25} />
    </svg>
  )
}
