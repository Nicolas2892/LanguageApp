interface Props {
  progress: number  // 0–100
  size?: number
  strokeWidth?: number
}

export function CircularProgress({ progress, size = 20, strokeWidth = 2.5 }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 100) / 100)
  const center = size / 2

  return (
    <svg
      width={String(size)}
      height={String(size)}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Background track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--d5-muted)"
        strokeWidth={strokeWidth}
        opacity={0.3}
      />
      {/* Foreground arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--d5-terracotta)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{
          strokeDashoffset: `${offset}`,
          transition: 'stroke-dashoffset 300ms ease',
        }}
      />
    </svg>
  )
}
