import { useState, useRef, useEffect, useCallback } from 'react'

export type SpeechRecognitionErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed'

export interface UseSpeechRecognitionReturn {
  supported: boolean
  listening: boolean
  processing: boolean
  transcript: string
  error: SpeechRecognitionErrorCode | null
  permissionState: 'unknown' | 'granted' | 'denied'
  start: () => void
  stop: () => void
}

const MAX_RECORDING_MS = 60_000

/** Detect best supported audio MIME for MediaRecorder */
function getAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
  return 'audio/webm'
}

function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined')
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<SpeechRecognitionErrorCode | null>(null)
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const busyRef = useRef(false)
  const unmountedRef = useRef(false)

  useEffect(() => {
    setSupported(isMediaRecorderSupported())
  }, [])

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    chunksRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      cleanup()
    }
  }, [cleanup])

  const transcribeAudio = useCallback(async (blob: Blob) => {
    if (unmountedRef.current) {
      busyRef.current = false
      return
    }
    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob, `recording.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`)

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (unmountedRef.current) return

      if (res.status === 429) {
        setError('service-not-allowed')
        return
      }

      if (!res.ok) {
        setError('network')
        return
      }

      const data = await res.json()
      if (unmountedRef.current) return
      setTranscript(data.text || '')
      setPermissionState('granted')
    } catch {
      if (!unmountedRef.current) {
        setError('network')
      }
    } finally {
      if (!unmountedRef.current) {
        setProcessing(false)
      }
      busyRef.current = false
    }
  }, [])

  const start = useCallback(() => {
    if (!isMediaRecorderSupported() || busyRef.current) return
    busyRef.current = true

    setError(null)
    setTranscript('')
    setListening(true)
    chunksRef.current = []

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (unmountedRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          busyRef.current = false
          return
        }

        streamRef.current = stream
        const mime = getAudioMime()
        const recorder = new MediaRecorder(stream, { mimeType: mime })
        recorderRef.current = recorder

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
          // Stop all tracks to dismiss iOS mic indicator
          stream.getTracks().forEach((t) => t.stop())
          streamRef.current = null

          if (unmountedRef.current) {
            busyRef.current = false
            return
          }

          setListening(false)

          const blob = new Blob(chunksRef.current, { type: mime })
          chunksRef.current = []

          if (blob.size === 0) {
            setError('no-speech')
            busyRef.current = false
            return
          }

          transcribeAudio(blob)
        }

        recorder.start()
        setPermissionState('granted')

        // Auto-stop after 60 seconds
        timeoutRef.current = setTimeout(() => {
          if (recorderRef.current && recorderRef.current.state === 'recording') {
            recorderRef.current.stop()
          }
        }, MAX_RECORDING_MS)
      })
      .catch((err: DOMException) => {
        if (unmountedRef.current) {
          busyRef.current = false
          return
        }
        if (err.name === 'NotAllowedError') {
          setPermissionState('denied')
          setError('not-allowed')
        } else {
          setError('audio-capture')
        }
        setListening(false)
        busyRef.current = false
      })
  }, [transcribeAudio])

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop()
      // onstop handler will set listening=false and trigger transcription
    } else {
      setListening(false)
    }
  }, [])

  return { supported, listening, processing, transcript, error, permissionState, start, stop }
}
