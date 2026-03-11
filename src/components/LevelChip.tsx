import { LEVEL_CHIP } from '@/lib/constants'

interface Props {
  level?: string | null
}

export function LevelChip({ level }: Props) {
  if (!level || !LEVEL_CHIP[level]) return null
  const { label, className } = LEVEL_CHIP[level]
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${className}`}>
      {label}
    </span>
  )
}
