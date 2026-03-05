'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  pct: number
  className?: string
}

export function AnimatedBar({ pct, className }: Props) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div
      className={cn('h-full rounded-full transition-all duration-700', className)}
      style={{ width: `${width}%` }}
    />
  )
}
