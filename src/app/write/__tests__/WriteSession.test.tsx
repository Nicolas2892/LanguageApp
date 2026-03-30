import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockPush = vi.fn()
const mockRouter = { push: mockPush, prefetch: vi.fn() }
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

vi.mock('@/lib/analytics', () => ({
  trackFreeWriteSubmitted: vi.fn(),
  trackFeatureFirstUse: vi.fn(),
}))

// Mock claude client to prevent Anthropic SDK import
vi.mock('@/lib/claude/client', () => ({
  anthropic: {},
  TUTOR_MODEL: 'test',
  GRADE_MODEL: 'test',
}))

// Mock heavy sub-components to prevent OOM
vi.mock('@/components/exercises/FreeWritePrompt', () => ({
  FreeWritePrompt: ({ prompt, loadingPrompt }: { prompt: string; loadingPrompt: boolean }) => (
    <div data-testid="free-write-prompt">
      {loadingPrompt ? 'Loading...' : prompt}
    </div>
  ),
}))

vi.mock('@/components/exercises/FeedbackPanel', () => ({
  FeedbackPanel: () => <div data-testid="feedback-panel" />,
}))

import { WriteSession } from '../WriteSession'

const CONCEPT_ID = '11111111-1111-1111-1111-111111111111'
const defaultProps = {
  conceptIds: [CONCEPT_ID],
  conceptInfos: [{ id: CONCEPT_ID, title: 'Test Concept' }],
}

describe('WriteSession error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to login on 401 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    )

    render(<WriteSession {...defaultProps} />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login?returnUrl=/write')
    })
  })

  it('shows rate limit message on 429 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 }),
    )

    render(<WriteSession {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Has alcanzado el límite. Espera unos minutos.')).toBeInTheDocument()
    })
  })

  it('shows generic error on 500 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 }),
    )

    render(<WriteSession {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('No se pudo generar un tema. Inténtalo de nuevo.')).toBeInTheDocument()
    })
  })

  it('shows generic error on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    render(<WriteSession {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('No se pudo generar un tema. Inténtalo de nuevo.')).toBeInTheDocument()
    })
  })

  it('renders prompt on successful response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ topic: 'Escribe sobre tu día favorito.' }), { status: 200 }),
    )

    render(<WriteSession {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Escribe sobre tu día favorito.')).toBeInTheDocument()
    })
  })
})
