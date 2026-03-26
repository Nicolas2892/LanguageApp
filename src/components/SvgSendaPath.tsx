// D5 Senda S-path — terracotta calligraphic mark, no background.
// Filled outline with thick→thin taper simulating a broad-nib pen stroke.
// Used inline in the SideNav and AppHeader wordmarks.

// Calligraphic filled outline: wider at bottom-left entry, tapers to top-right exit.
// Designed in a 24×24 viewBox. The outer and inner edges are offset to create
// variable stroke width — ~3.5px at the base, ~1.5px at the tip.
const S_FILL_PATH = [
  // Outer edge (bottom-left to top-right)
  'M 5.2 21',
  'C 1 19.5, -0.8 14.5, 2.5 11',
  'C 5.8 7.5, 14.2 9.8, 17.2 7',
  'C 20.2 4.2, 20.8 0.5, 17.8 0.8',
  // Tip cap
  'C 16.5 0.2, 15.8 2.2, 17 3.2',
  // Inner edge (top-right back to bottom-left)
  'C 21 1.5, 21.5 5.8, 18.8 8.8',
  'C 16 12, 7.5 9.5, 5 12.5',
  'C 2.5 15.5, 4 19, 7.2 20',
  // Base cap
  'C 8.5 21, 7 21.5, 5.2 21',
  'Z',
].join(' ')

// Legacy stroked path kept for BackgroundMagicS and SplashScreen trail
export const S_STROKE_PATH = 'M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2'

export function SvgSendaPath({ size = 20 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={S_FILL_PATH} fill="var(--d5-terracotta)" />
    </svg>
  )
}
