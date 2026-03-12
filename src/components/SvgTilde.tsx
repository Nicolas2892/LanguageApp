export function SvgTilde({ size = 48 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 48 20"
      width={size}
      height={size * (20 / 48)}
      aria-hidden
    >
      <path
        d="M 3 14 C 10 4, 18 18, 24 12 C 30 6, 38 16, 45 10"
        stroke="var(--d5-terracotta)"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
