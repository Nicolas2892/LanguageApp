interface Props {
  streak: number
  freezeRemaining: number
}

export function StreakFreezeStatus({ streak, freezeRemaining }: Props) {
  if (streak <= 0) return null

  const available = freezeRemaining > 0

  return (
    <span
      className="inline-flex items-center gap-1 ml-2"
      style={{ color: available ? 'var(--d5-muted)' : 'var(--d5-muted)', opacity: available ? 1 : 0.5 }}
    >
      <svg
        width={10}
        height={10}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden="true"
      >
        <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
      </svg>
      <span className="text-[10px] font-medium">
        {available ? 'Protección activa' : 'Protección usada'}
      </span>
    </span>
  )
}
