'use client'

import { Volume2 } from 'lucide-react'
import { useSpeech } from '@/lib/hooks/useSpeech'

interface Props {
  text: string
  lang?: string
}

export function SpeakButton({ text, lang = 'es-ES' }: Props) {
  const { speak, speaking, enabled } = useSpeech()

  // Don't render until we know audio is enabled (avoids SSR mismatch and
  // prevents a flash of the button when audio is disabled)
  if (enabled !== true) return null

  return (
    <button
      type="button"
      onClick={() => speak(text, lang)}
      aria-label="Play audio"
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0
        ${speaking
          ? 'text-orange-500 bg-orange-100'
          : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-100'
        }`}
    >
      <Volume2 className="h-3.5 w-3.5" />
    </button>
  )
}
