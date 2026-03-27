// D5 Senda S-path — terracotta calligraphic mark, no background.
// Filled broad-nib S with natural variable width (thick bowls, thin crossing).
// Used inline in the SideNav, AppHeader, splash screen, and tutor wordmarks.

// Calligraphic filled S — single closed path, broad-nib pen simulation
const S_FILL_PATH = 'M 6 21 C 2.5 20, 0.5 17, 1.5 14 C 2.5 11, 5.5 10, 9 9 C 12.5 8, 16 7, 18 5 C 19.5 3.5, 19 1.5, 17 1.5 C 16.5 1.5, 16.8 2.5, 17.5 3 C 19 2, 21 3, 20.5 5.5 C 20 8, 17 9.5, 13.5 10.5 C 10 11.5, 6.5 12, 4.5 14 C 2.5 16, 3 19, 5.5 20 C 7 20.8, 7.5 20, 6 21 Z'

// Stroked path kept for BackgroundMagicS trail and SplashScreen trail (larger viewBox)
export const S_STROKE_PATH = 'M 7 20 C 4 18, 1 15, 4 12 C 7 9, 14 9.5, 18 8 C 20.5 5.5, 20 1.5, 16.5 2.5'

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
