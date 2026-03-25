'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { PronunciationResult } from '@/lib/azure/client'

type RecordingState = 'idle' | 'recording' | 'processing'
type ErrorCode = 'not-allowed' | 'audio-capture' | 'network' | 'rate-limit' | 'no-speech' | null

const MAX_RECORDING_MS = 15_000 // 15 seconds for sentence reading

function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  )
}

function getAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
  return 'audio/webm'
}

export interface UsePronunciationRecordingReturn {
  supported: boolean
  state: RecordingState
  result: PronunciationResult | null
  userAudioUrl: string | null
  error: ErrorCode
  permissionState: 'unknown' | 'granted' | 'denied'
  startRecording: (referenceText: string) => void
  stop: () => void
  reset: () => void
}

export function usePronunciationRecording(): UsePronunciationRecordingReturn {
  const [supported] = useState(isMediaRecorderSupported)
  const [state, setState] = useState<RecordingState>('idle')
  const [result, setResult] = useState<PronunciationResult | null>(null)
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<ErrorCode>(null)
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const referenceTextRef = useRef('')
  const unmountedRef = useRef(false)

  const cleanup = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    recorderRef.current = null
    streamRef.current = null
    chunksRef.current = []
  }, [])

  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      cleanup()
      // Revoke any user audio URL
    }
  }, [cleanup])

  const assessAudio = useCallback(async (blob: Blob) => {
    if (unmountedRef.current) return

    setState('processing')

    // Create playback URL for user's recording
    const url = URL.createObjectURL(blob)
    setUserAudioUrl(url)

    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
    const formData = new FormData()
    formData.append('audio', blob, `recording.${ext}`)
    formData.append('text', referenceTextRef.current)

    try {
      const res = await fetch('/api/pronunciation/assess', {
        method: 'POST',
        body: formData,
      })

      if (unmountedRef.current) return

      if (res.status === 429) {
        setError('rate-limit')
        setState('idle')
        return
      }

      if (!res.ok) {
        setError('network')
        setState('idle')
        return
      }

      const data = (await res.json()) as PronunciationResult
      setResult(data)
      setState('idle')
    } catch {
      if (!unmountedRef.current) {
        setError('network')
        setState('idle')
      }
    }
  }, [])

  const startRecording = useCallback((referenceText: string) => {
    if (!supported || state === 'recording' || state === 'processing') return

    referenceTextRef.current = referenceText
    setError(null)
    setResult(null)
    setUserAudioUrl(null)
    chunksRef.current = []

    const mime = getAudioMime()

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (unmountedRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        const recorder = new MediaRecorder(stream, { mimeType: mime })
        recorderRef.current = recorder

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          const blob = new Blob(chunksRef.current, { type: mime })
          if (blob.size > 0) {
            assessAudio(blob)
          } else {
            setError('no-speech')
            setState('idle')
          }
        }

        recorder.start()
        setState('recording')
        setPermissionState('granted')

        // Auto-stop after MAX_RECORDING_MS
        timeoutRef.current = setTimeout(() => {
          if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop()
          }
        }, MAX_RECORDING_MS)
      })
      .catch((err) => {
        if (unmountedRef.current) return
        if (err.name === 'NotAllowedError') {
          setPermissionState('denied')
          setError('not-allowed')
        } else {
          setError('audio-capture')
        }
        setState('idle')
      })
  }, [supported, state, assessAudio])

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    if (userAudioUrl) {
      URL.revokeObjectURL(userAudioUrl)
      setUserAudioUrl(null)
    }
  }, [userAudioUrl])

  return {
    supported,
    state,
    result,
    userAudioUrl,
    error,
    permissionState,
    startRecording,
    stop,
    reset,
  }
}
