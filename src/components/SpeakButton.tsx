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
      aria-label="Reproducir audio"
      className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:w-7 sm:h-7 sm:min-w-0 sm:min-h-0 rounded-full transition-colors shrink-0
        ${speaking
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
        }`}
    >
      <Volume2 className="h-3.5 w-3.5" />
    </button>
  )
}
