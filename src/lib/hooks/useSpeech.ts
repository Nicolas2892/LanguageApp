import { useState, useEffect } from 'react'

const STORAGE_KEY = 'audio_enabled'

export function useSpeech() {
  // null = not yet determined (before first mount/effect)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(stored === 'false' ? false : true)
    } catch {
      setEnabled(true)
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
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
    if (!next && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel()
      setSpeaking(false)
    }
  }

  return { speak, speaking, enabled, toggle }
}
