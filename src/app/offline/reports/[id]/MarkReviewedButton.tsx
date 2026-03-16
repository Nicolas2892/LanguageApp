'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  reportId: string
}

export function MarkReviewedButton({ reportId }: Props) {
  const router = useRouter()
  const [marking, setMarking] = useState(false)

  async function handleMark() {
    setMarking(true)
    try {
      await fetch(`/api/offline/reports/${reportId}/review`, {
        method: 'POST',
      })
      router.push('/dashboard')
    } catch {
      setMarking(false)
    }
  }

  return (
    <Button
      onClick={handleMark}
      disabled={marking}
      className="w-full rounded-full active:scale-95 transition-transform"
    >
      <CheckCircle2 size={16} strokeWidth={1.5} className="mr-2" />
      {marking ? 'Marcando…' : 'Marcar como revisado'}
    </Button>
  )
}
