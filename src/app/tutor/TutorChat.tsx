'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SvgSendaPath } from '@/components/SvgSendaPath'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import { trackTutorMessageSent, trackFeatureFirstUse } from '@/lib/analytics'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  initialMessages?: Message[]
  conceptId?: string
  conceptTitle?: string
}

const CHAT_STORAGE_KEY = 'tutor_chat_messages'

function restoreMessages(): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Message[]
  } catch { return [] }
}

export function TutorChat({ initialMessages = [], conceptId, conceptTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const restored = restoreMessages()
    return restored.length > 0 ? restored : initialMessages
  })
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Abort in-flight stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    // Persist non-empty conversations to sessionStorage (survives page refresh, clears on tab close)
    if (messages.length > 0) {
      try { sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)) } catch { /* quota */ }
    }
  }, [messages])

  useEffect(() => {
    trackFeatureFirstUse('tutor')
  }, [])

  const STARTERS = [
    '¿Cómo uso el subjuntivo?',
    'Explícame ser vs estar',
    '¿Qué son los conectores?',
    'Practica conmigo un diálogo',
  ]

  async function handleSend(directText?: string) {
    const text = (directText ?? input).trim()
    if (!text || streaming) return
    trackTutorMessageSent(conceptId)

    const userMessage: Message = { role: 'user', content: text }
    const next = [...messages, userMessage]
    setMessages(next)
    if (!directText) setInput('')
    setStreaming(true)

    // Add empty assistant message to stream into
    setMessages((m) => [...m, { role: 'assistant', content: '' }])

    try {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          conceptId,
        }),
        signal: controller.signal,
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages((m) => {
          const updated = [...m]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const isNetworkError = err instanceof TypeError
      setMessages((m) => {
        const updated = [...m]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: isNetworkError
            ? 'Sin conexión a internet. Revisa tu red.'
            : 'Algo salió mal. Inténtalo de nuevo.',
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Concept badge */}
      {conceptTitle && (
        <div
          className="px-4 py-2 text-xs"
          style={{
            background: 'var(--d5-surface-tint)',
            borderBottom: '1px solid var(--d5-line)',
            color: 'var(--d5-body)',
          }}
        >
          Contexto: <span className="font-medium text-foreground">{conceptTitle}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" aria-live="polite">
        {messages.length === 0 && (
          <div className="relative overflow-hidden text-center pt-12 space-y-3">
            <BackgroundMagicS />
            <div className="flex justify-center">
              <SvgSendaPath size={40} />
            </div>
            <p className="senda-heading text-xl">Pregunta lo que Quieras</p>
            <p className="text-sm" style={{ color: 'var(--d5-body)' }}>
              Gramática, errores frecuentes, ejemplos… estoy aquí para ayudarte.
            </p>
            <p className="text-xs" style={{ color: 'var(--d5-subtle)' }}>
              Shift+Enter para nueva línea · Enter para enviar
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {STARTERS.map((text) => (
                <button
                  key={text}
                  onClick={() => handleSend(text)}
                  className="senda-cta-outline text-xs"
                  style={{ padding: '0.375rem 0.75rem' }}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${i === messages.length - 1 ? 'animate-message-in' : ''}`}
          >
            <div
              className={`max-w-[85%] max-w-prose rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'senda-bubble rounded-bl-sm'
              }`}
            >
              {msg.content}
              {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2 items-end"
        style={{ borderTop: '1px solid var(--d5-line)' }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta a tu tutor…"
          rows={2}
          className="senda-input resize-none flex-1 text-sm"
          disabled={streaming}
        />
        <Button onClick={() => handleSend()} disabled={!input.trim() || streaming} className="shrink-0">
          Enviar
        </Button>
      </div>
    </div>
  )
}
