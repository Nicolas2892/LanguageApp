'use client'

import { Mic, MicOff, Loader2 } from 'lucide-react'
import type { UseSpeechRecognitionReturn } from '@/lib/hooks/useSpeechRecognition'

interface Props {
  stt: UseSpeechRecognitionReturn
  disabled?: boolean
}

export function MicButton({ stt, disabled }: Props) {
  const { supported, listening, processing, permissionState, error, start, stop } = stt

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="Dictación no disponible"
        aria-label="Dictación no disponible"
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

  if (processing) {
    return (
      <button
        type="button"
        disabled
        title="Procesando audio…"
        aria-label="Procesando audio"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-orange-500 bg-orange-100 dark:bg-orange-950/40 cursor-not-allowed"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </button>
    )
  }

  const isNoSpeech = error === 'no-speech'
  const isAudioCapture = error === 'audio-capture'
  const isRateLimited = error === 'service-not-allowed'

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled || processing}
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
      {isRateLimited && (
        <p className="text-xs text-destructive">Límite de dictados alcanzado — inténtalo más tarde</p>
      )}
    </div>
  )
}
