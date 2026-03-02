'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  initialMessages?: Message[]
  conceptId?: string
  conceptTitle?: string
}

export function TutorChat({ initialMessages = [], conceptId, conceptTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || streaming) return

    const userMessage: Message = { role: 'user', content: text }
    const next = [...messages, userMessage]
    setMessages(next)
    setInput('')
    setStreaming(true)

    // Add empty assistant message to stream into
    setMessages((m) => [...m, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          conceptId,
        }),
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
    } catch {
      setMessages((m) => {
        const updated = [...m]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
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
        <div className="px-4 py-2 bg-muted/50 border-b text-xs text-muted-foreground">
          Context: <span className="font-medium text-foreground">{conceptTitle}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm pt-12 space-y-2">
            <p className="text-2xl">💬</p>
            <p>Ask me anything about Spanish grammar, your mistakes, or request more examples.</p>
            <p className="text-xs">Shift+Enter for new line, Enter to send.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted rounded-bl-sm'
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
      <div className="border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your tutor…"
          rows={2}
          className="resize-none flex-1 text-sm"
          disabled={streaming}
        />
        <Button onClick={handleSend} disabled={!input.trim() || streaming} className="shrink-0">
          Send
        </Button>
      </div>
    </div>
  )
}
