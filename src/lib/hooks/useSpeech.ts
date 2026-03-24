import { useState, useEffect } from 'react'
import { storage } from '@/lib/platform/storage'

const STORAGE_KEY = 'audio_enabled'

export function useSpeech() {
  // null = not yet determined (before first mount/effect)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    const stored = storage.get(STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(stored === 'false' ? false : true)
    return () => {
      // Cancel any in-progress speech on unmount
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function speak(text: string, lang = 'es-ES') {
    if (enabled !== true) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  function toggle() {
    // Treat null (loading) as currently-on so the toggle turns it off
    const currentlyEnabled = enabled !== false
    const next = !currentlyEnabled
    setEnabled(next)
    storage.set(STORAGE_KEY, String(next))
    if (!next && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel()
      setSpeaking(false)
    }
  }

  return { speak, speaking, enabled, toggle }
}
