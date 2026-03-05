'use client'

import { usePathname } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

export function PageWrapper({ children }: Props) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  )
}
