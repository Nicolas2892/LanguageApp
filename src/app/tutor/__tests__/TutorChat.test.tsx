import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TutorChat, type Message } from '../TutorChat'

// ─── jsdom stubs ────────────────────────────────────────────────────────────

// scrollIntoView is not implemented in jsdom
Element.prototype.scrollIntoView = vi.fn()

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeStream(chunks: string[]) {
  let i = 0
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(new TextEncoder().encode(chunks[i]))
        i++
      } else {
        controller.close()
      }
    },
  })
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('TutorChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Empty state ─────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders SvgSendaPath icon in empty state', () => {
      const { container } = render(<TutorChat />)
      const svgs = container.querySelectorAll('svg')
      // Should have BackgroundMagicS + SvgSendaPath (at least 2)
      expect(svgs.length).toBeGreaterThanOrEqual(2)
    })

    it('renders senda-heading "Pregunta lo que Quieras"', () => {
      render(<TutorChat />)
      const heading = screen.getByText('Pregunta lo que Quieras')
      expect(heading).toHaveClass('senda-heading')
    })

    it('renders Spanish body and hint text', () => {
      render(<TutorChat />)
      expect(screen.getByText(/Gramática, errores frecuentes/)).toBeInTheDocument()
      expect(screen.getByText(/Shift\+Enter para nueva línea/)).toBeInTheDocument()
    })

    it('empty state vanishes when messages exist', () => {
      const msgs: Message[] = [{ role: 'user', content: 'Hola' }]
      render(<TutorChat initialMessages={msgs} />)
      expect(screen.queryByText('Pregunta lo que Quieras')).not.toBeInTheDocument()
    })
  })

  // ── Concept badge ───────────────────────────────────────────────────────

  describe('concept badge', () => {
    it('renders concept badge with "Contexto:" label', () => {
      render(<TutorChat conceptTitle="Ser vs Estar" conceptId="c1" />)
      expect(screen.getByText(/Contexto:/)).toBeInTheDocument()
      expect(screen.getByText('Ser vs Estar')).toBeInTheDocument()
    })

    it('does not render concept badge when no conceptTitle', () => {
      render(<TutorChat />)
      expect(screen.queryByText(/Contexto:/)).not.toBeInTheDocument()
    })
  })

  // ── Message bubbles ─────────────────────────────────────────────────────

  describe('message bubbles', () => {
    it('user bubble uses bg-primary', () => {
      const msgs: Message[] = [{ role: 'user', content: 'Hola tutor' }]
      render(<TutorChat initialMessages={msgs} />)
      const bubble = screen.getByText('Hola tutor')
      expect(bubble.className).toContain('bg-primary')
    })

    it('assistant bubble uses senda-bubble class', () => {
      const msgs: Message[] = [{ role: 'assistant', content: '¡Hola!' }]
      render(<TutorChat initialMessages={msgs} />)
      const bubble = screen.getByText('¡Hola!')
      expect(bubble.className).toContain('senda-bubble')
    })
  })

  // ── Input area ──────────────────────────────────────────────────────────

  describe('input area', () => {
    it('shows Spanish placeholder', () => {
      render(<TutorChat />)
      expect(screen.getByPlaceholderText('Pregunta a tu tutor…')).toBeInTheDocument()
    })

    it('shows "Enviar" button label', () => {
      render(<TutorChat />)
      expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
    })

    it('Enviar button is disabled when input is empty', () => {
      render(<TutorChat />)
      expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
    })
  })

  // ── Keyboard ────────────────────────────────────────────────────────────

  describe('keyboard', () => {
    it('Enter sends message and clears input', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(makeStream(['Respuesta']), { status: 200 })
      )

      const user = userEvent.setup()
      render(<TutorChat />)

      const textarea = screen.getByPlaceholderText('Pregunta a tu tutor…')
      await user.type(textarea, 'Hola{Enter}')

      expect(fetchSpy).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }))
      // Input should be cleared
      expect(textarea).toHaveValue('')
    })
  })

  // ── Streaming ───────────────────────────────────────────────────────────

  describe('streaming', () => {
    it('streams assistant response into bubble', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(makeStream(['Hola, ', '¿cómo estás?']), { status: 200 })
      )

      const user = userEvent.setup()
      render(<TutorChat />)

      await user.type(screen.getByPlaceholderText('Pregunta a tu tutor…'), 'Hi{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Hola, ¿cómo estás?')).toBeInTheDocument()
      })
    })

    it('shows Spanish error on fetch failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'))

      const user = userEvent.setup()
      render(<TutorChat />)

      await user.type(screen.getByPlaceholderText('Pregunta a tu tutor…'), 'Test{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Algo salió mal. Inténtalo de nuevo.')).toBeInTheDocument()
      })
    })
  })
})
