'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface UseNativeAudioReturn {
  /** Fetch (if needed) and play TTS audio for the given text. */
  play: (text: string) => void
  /** True while audio is currently playing. */
  playing: boolean
  /** Object URL of the most recently fetched audio (for A/B comparison). */
  audioUrl: string | null
  /** Error message if fetch or playback failed. */
  error: string | null
}

/**
 * Hook to fetch, cache, and play native TTS audio via POST /api/tts.
 * Caches audio by text within the component lifecycle (session-scoped).
 */
export function useNativeAudio(): UseNativeAudioReturn {
  const [playing, setPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cacheRef = useRef(new Map<string, string>()) // text → object URL
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unmountedRef = useRef(false)

  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      // Revoke all cached object URLs
      for (const url of cacheRef.current.values()) {
        URL.revokeObjectURL(url)
      }
      cacheRef.current.clear()
    }
  }, [])

  const play = useCallback(async (text: string) => {
    setError(null)

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    try {
      let url = cacheRef.current.get(text)

      if (!url) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })

        if (!res.ok) {
          if (unmountedRef.current) return
          setError(res.status === 429 ? 'rate-limit' : 'network')
          return
        }

        const blob = await res.blob()
        url = URL.createObjectURL(blob)
        cacheRef.current.set(text, url)
      }

      if (unmountedRef.current) return
      setAudioUrl(url)

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay = () => { if (!unmountedRef.current) setPlaying(true) }
      audio.onended = () => {
        if (!unmountedRef.current) setPlaying(false)
        audioRef.current = null
      }
      audio.onerror = () => {
        if (!unmountedRef.current) {
          setPlaying(false)
          setError('playback')
        }
        audioRef.current = null
      }

      await audio.play()
    } catch {
      if (!unmountedRef.current) {
        setPlaying(false)
        setError('network')
      }
    }
  }, [])

  return { play, playing, audioUrl, error }
}
