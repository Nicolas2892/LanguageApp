// D5 Senda S-path — terracotta calligraphic mark, no background.
// Refined uniform stroke with improved curve geometry:
//   - Steeper entry angle (~30°) for confident pen-down feel
//   - Clean middle sweep (no inflection hump)
//   - Softened exit recurve (pen-lift flick, not wall-stop)
// Used inline in the SideNav and AppHeader wordmarks.

const S_PATH = 'M 7 20 C 4 18, 1 15, 4 12 C 7 9, 14 9.5, 18 8 C 20.5 5.5, 20 1.5, 16.5 2.5'

// Legacy path kept for BackgroundMagicS and SplashScreen trail (larger viewBox scale)
export const S_STROKE_PATH = 'M 7 20 C 4 18, 1 15, 4 12 C 7 9, 14 9.5, 18 8 C 20.5 5.5, 20 1.5, 16.5 2.5'

export function SvgSendaPath({ size = 20, strokeWidth = 3.5 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={S_PATH} stroke="var(--d5-terracotta)" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}
