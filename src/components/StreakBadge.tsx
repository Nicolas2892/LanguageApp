'use client'

interface Props {
  streak: number
  size?: 'sm' | 'md'
}

export function StreakBadge({ streak, size = 'sm' }: Props) {
  const isActive = streak > 0
  const color = isActive ? 'var(--d5-terracotta)' : 'var(--d5-muted)'
  const iconSize = size === 'sm' ? 16 : 20

  return (
    <div className="flex items-center gap-1" aria-label={`${streak} día${streak !== 1 ? 's' : ''} de racha`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={color}
        aria-hidden="true"
      >
        <path d="M12 23c-4.97 0-8-3.03-8-7.5 0-3.82 2.83-7.2 5.65-9.94a.75.75 0 0 1 1.12.12c.7 1.05 1.48 1.88 2.23 2.38.12-.93.43-2.2 1.15-3.56a.75.75 0 0 1 1.31-.05C17.3 7.8 20 11.58 20 15.5 20 19.97 16.97 23 12 23Zm-1.5-6.5c0 1.38.62 2.5 1.5 2.5s1.5-1.12 1.5-2.5c0-1.1-.5-2.2-1.5-3.5-1 1.3-1.5 2.4-1.5 3.5Z" />
      </svg>
      <span
        className="font-semibold"
        style={{
          fontSize: size === 'sm' ? 12 : 14,
          color,
          lineHeight: 1,
        }}
      >
        {streak}
        {size === 'md' && (
          <span style={{ fontWeight: 500, marginLeft: 2 }}>
            {streak === 1 ? 'día' : 'días'}
          </span>
        )}
      </span>
    </div>
  )
}
