import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HardFlagButton } from '../HardFlagButton'

const CONCEPT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HardFlagButton', () => {
  describe('initial render', () => {
    it('shows "Mark as hard" aria-label when not hard', () => {
      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={false} />)
      const btn = screen.getByRole('button', { name: 'Marcar como difícil' })
      expect(btn).toBeDefined()
    })

    it('shows "Remove hard flag" aria-label when hard', () => {
      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={true} />)
      const btn = screen.getByRole('button', { name: 'Quitar marca de difícil' })
      expect(btn).toBeDefined()
    })

    it('has terracotta active class when initialIsHard is true', () => {
      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={true} />)
      const classes = screen.getByRole('button').className.split(/\s+/)
      // Active state uses bare `text-[var(--d5-terracotta)]`, not hover variant
      expect(classes).toContain('text-[var(--d5-terracotta)]')
    })

    it('does not have bare terracotta active class when initialIsHard is false', () => {
      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={false} />)
      const classes = screen.getByRole('button').className.split(/\s+/)
      // Inactive state only has hover:text-[var(--d5-terracotta)], not the bare class
      expect(classes).not.toContain('text-[var(--d5-terracotta)]')
    })
  })

  describe('optimistic toggle', () => {
    it('toggles aria-label immediately on click (not hard → hard)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ is_hard: true }) }))

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={false} />)
      const btn = screen.getByRole('button', { name: 'Marcar como difícil' })

      fireEvent.click(btn)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Quitar marca de difícil' })).toBeDefined()
      })
    })

    it('toggles aria-label immediately on click (hard → not hard)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ is_hard: false }) }))

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={true} />)
      const btn = screen.getByRole('button', { name: 'Quitar marca de difícil' })

      fireEvent.click(btn)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Marcar como difícil' })).toBeDefined()
      })
    })

    it('calls fetch with correct URL and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ is_hard: true }) })
      vi.stubGlobal('fetch', mockFetch)

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={false} />)
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/concepts/${CONCEPT_ID}/hard`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ is_hard: true }),
          }),
        )
      })
    })
  })

  describe('revert on fetch failure', () => {
    it('reverts to original state when fetch returns non-ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={false} />)
      fireEvent.click(screen.getByRole('button', { name: 'Marcar como difícil' }))

      // After fetch failure, should revert back to "Mark as hard"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Marcar como difícil' })).toBeDefined()
      })
    })

    it('reverts to original state when fetch throws', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={true} />)
      fireEvent.click(screen.getByRole('button', { name: 'Quitar marca de difícil' }))

      // After fetch failure, should revert back to "Remove hard flag"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Quitar marca de difícil' })).toBeDefined()
      })
    })

    it('shows inline error text when fetch returns non-ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={false} />)
      fireEvent.click(screen.getByRole('button', { name: 'Marcar como difícil' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined()
        expect(screen.getByText('Error al guardar')).toBeDefined()
      })
    })

    it('shows inline error text when fetch throws', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={false} />)
      fireEvent.click(screen.getByRole('button', { name: 'Marcar como difícil' }))

      await waitFor(() => {
        expect(screen.getByText('Error al guardar')).toBeDefined()
      })
    })
  })
})
