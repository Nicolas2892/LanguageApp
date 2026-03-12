'use client'

import { Mic, MicOff } from 'lucide-react'
import type { UseSpeechRecognitionReturn } from '@/lib/hooks/useSpeechRecognition'

interface Props {
  stt: UseSpeechRecognitionReturn
  disabled?: boolean
}

export function MicButton({ stt, disabled }: Props) {
  const { supported, listening, permissionState, error, start, stop } = stt

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="El reconocimiento de voz no está disponible en tu navegador"
        aria-label="Reconocimiento de voz no disponible"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground/40 cursor-not-allowed"
      >
        <MicOff className="h-4 w-4" />
      </button>
    )
  }

  if (permissionState === 'denied') {
    return (
      <button
        type="button"
        disabled
        title="Acceso al micrófono denegado — revisa la configuración de tu navegador"
        aria-label="Acceso al micrófono denegado"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground/40 cursor-not-allowed"
      >
        <MicOff className="h-4 w-4" />
      </button>
    )
  }

  const isNoSpeech = error === 'no-speech'
  const isAudioCapture = error === 'audio-capture'

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        title={listening ? 'Escuchando… pulsa para detener' : 'Dictar tu respuesta'}
        aria-label={listening ? 'Detener dictado' : 'Iniciar dictado'}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors
          ${listening
            ? 'text-orange-500 bg-orange-100 dark:bg-orange-950/40 animate-pulse'
            : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-950/40'
          }
          disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <Mic className="h-4 w-4" />
      </button>
      {isNoSpeech && (
        <p className="text-xs text-muted-foreground">No se detectó voz — inténtalo de nuevo</p>
      )}
      {isAudioCapture && (
        <p className="text-xs text-destructive">No se pudo acceder al micrófono</p>
      )}
    </div>
  )
}
