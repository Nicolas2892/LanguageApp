// D5 "Senda" logomark — calligraphic S-path on crisp vellum background.
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
      style={{
        borderRadius: radius,
        display: 'block',
        border: '1px solid rgba(197,167,140,0.55)',
      }}
    >
      <rect width="100" height="100" fill="#FDFCF9" />
      <path
        d="M 30 82 C 10 80, 4 64, 16 52 C 28 40, 56 44, 68 34 C 80 24, 84 10, 72 6"
        stroke="#C4522E"
        strokeWidth={18}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
