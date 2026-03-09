// D4 "Senda" logomark — calligraphic S-path on forest green background.
// Square viewBox 100×100, rendered at requested size.
export function LogoMark({ size = 32 }: { size?: number }) {
  const radius = Math.round(size * 0.22) // ~22% of size → proportional corner radius
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ borderRadius: radius, display: 'block' }}
    >
      <rect width="100" height="100" fill="#2C5F2E" />
      <path
        d="M 36 80 C 20 78, 12 64, 20 54 C 28 44, 50 46, 62 38 C 74 30, 78 18, 68 12"
        stroke="#F7F3EC"
        strokeWidth={12}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
