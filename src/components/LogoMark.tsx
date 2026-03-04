// Speech bubble mark with Ñ — server-compatible, no 'use client' needed.
// viewBox: 36×34 — 36px wide bubble body, 10px tail below at y=24–32.
export function LogoMark({ size = 32 }: { size?: number }) {
  const height = Math.round((size * 34) / 36)
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 36 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Speech bubble path: rounded rect body + bottom-left tail */}
      <path
        d="M5 0h26a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H15l-9 8v-8H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5z"
        fill="#ea580c"
      />
      <text
        x="18"
        y="12"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="sans-serif"
        fontSize="13"
        fontWeight="900"
        fill="white"
      >
        Ñ
      </text>
    </svg>
  )
}
