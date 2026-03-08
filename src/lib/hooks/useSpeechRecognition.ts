import { useState, useRef, useEffect } from 'react'

export type SpeechRecognitionErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed'

// Minimal interface for the Web Speech Recognition API.
// TypeScript's lib.dom.d.ts omits webkitSpeechRecognition; we declare it here.
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export interface UseSpeechRecognitionReturn {
  supported: boolean
  listening: boolean
  transcript: string
  error: SpeechRecognitionErrorCode | null
  permissionState: 'unknown' | 'granted' | 'denied'
  start: () => void
  stop: () => void
}

// Note: Chrome streams audio to Google's servers for recognition. Safari uses
// Apple's engine. This component never receives or stores raw audio — only the
// text transcript is accessible to our code.
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<SpeechRecognitionErrorCode | null>(null)
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!getSpeechRecognition())
  }, [])

  // Abort on unmount to avoid state updates after component is gone
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  function start() {
    const SpeechRecognitionAPI = getSpeechRecognition()
    if (!SpeechRecognitionAPI) return

    // Abort any in-progress instance before starting a new one
    recognitionRef.current?.abort()

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      setPermissionState('granted')
    }

    recognition.onerror = (event) => {
      const code = event.error as SpeechRecognitionErrorCode
      setError(code)
      if (code === 'not-allowed') {
        setPermissionState('denied')
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    setError(null)
    setTranscript('')
    setListening(true)
    recognition.start()
  }

  function stop() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return { supported, listening, transcript, error, permissionState, start, stop }
}
