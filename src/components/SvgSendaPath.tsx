// D5 Senda S-path — terracotta calligraphic mark, no background.
// Used inline in the SideNav and AppHeader wordmarks.
const S_PATH = 'M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2'

export function SvgSendaPath({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={S_PATH} stroke="var(--d5-terracotta)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
