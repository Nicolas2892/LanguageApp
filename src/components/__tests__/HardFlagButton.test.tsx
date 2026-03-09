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
      const btn = screen.getByRole('button', { name: 'Mark as hard' })
      expect(btn).toBeDefined()
    })

    it('shows "Remove hard flag" aria-label when hard', () => {
      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={true} />)
      const btn = screen.getByRole('button', { name: 'Remove hard flag' })
      expect(btn).toBeDefined()
    })

    it('has orange active class when initialIsHard is true', () => {
      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={true} />)
      const classes = screen.getByRole('button').className.split(/\s+/)
      // Active state uses bare `text-orange-500`, not `hover:text-orange-500`
      expect(classes).toContain('text-orange-500')
    })

    it('does not have bare orange active class when initialIsHard is false', () => {
      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={false} />)
      const classes = screen.getByRole('button').className.split(/\s+/)
      // Inactive state only has hover:text-orange-500, not the bare class
      expect(classes).not.toContain('text-orange-500')
    })
  })

  describe('optimistic toggle', () => {
    it('toggles aria-label immediately on click (not hard → hard)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ is_hard: true }) }))

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={false} />)
      const btn = screen.getByRole('button', { name: 'Mark as hard' })

      fireEvent.click(btn)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Remove hard flag' })).toBeDefined()
      })
    })

    it('toggles aria-label immediately on click (hard → not hard)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ is_hard: false }) }))

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={true} />)
      const btn = screen.getByRole('button', { name: 'Remove hard flag' })

      fireEvent.click(btn)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Mark as hard' })).toBeDefined()
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
      fireEvent.click(screen.getByRole('button', { name: 'Mark as hard' }))

      // After fetch failure, should revert back to "Mark as hard"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Mark as hard' })).toBeDefined()
      })
    })

    it('reverts to original state when fetch throws', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      render(<HardFlagButton conceptId={CONCEPT_ID} initialIsHard={true} />)
      fireEvent.click(screen.getByRole('button', { name: 'Remove hard flag' }))

      // After fetch failure, should revert back to "Remove hard flag"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Remove hard flag' })).toBeDefined()
      })
    })
  })
})
