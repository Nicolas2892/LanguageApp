import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountForm } from '../AccountForm'
import type { Profile } from '@/lib/supabase/types'

const baseProfile: Profile = {
  id: 'user-1',
  display_name: 'Nicolas',
  current_level: 'B1',
  daily_goal_minutes: 15,
  streak: 5,
  last_studied_date: '2026-03-01',
  created_at: '2026-01-01T00:00:00Z',
  onboarding_completed: true,
}

function mockFetchSuccess() {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true }),
  } as Response)
}

function mockFetchError(message = 'Failed to save') {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: message }),
  } as Response)
}

describe('AccountForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  // --- Initial render ---

  it('pre-fills display name from profile', () => {
    render(<AccountForm profile={baseProfile} />)
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Nicolas')
  })

  it('pre-fills daily goal from profile', () => {
    render(<AccountForm profile={baseProfile} />)
    expect((screen.getByLabelText('Daily goal (minutes)') as HTMLInputElement).value).toBe('15')
  })

  it('highlights current level from profile', () => {
    render(<AccountForm profile={baseProfile} />)
    const b1Btn = screen.getByRole('button', { name: /^B1/ })
    expect(b1Btn.className).toContain('bg-orange-50')
  })

  it('renders all three level options', () => {
    render(<AccountForm profile={baseProfile} />)
    expect(screen.getByRole('button', { name: /^A2/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^B1/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^B2/ })).toBeTruthy()
  })

  it('shows "Save changes" as initial button text', () => {
    render(<AccountForm profile={baseProfile} />)
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy()
  })

  // --- Level picker ---

  it('updates the selected level when a different level is clicked', async () => {
    render(<AccountForm profile={baseProfile} />)
    await userEvent.click(screen.getByRole('button', { name: /^B2/ }))
    expect(screen.getByRole('button', { name: /^B2/ }).className).toContain('bg-orange-50')
    expect(screen.getByRole('button', { name: /^B1/ }).className).not.toContain('bg-orange-50')
  })

  // --- Validation (client-side) ---

  it('shows error when daily goal is below 5', async () => {
    render(<AccountForm profile={baseProfile} />)
    await userEvent.clear(screen.getByLabelText('Daily goal (minutes)'))
    await userEvent.type(screen.getByLabelText('Daily goal (minutes)'), '4')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Daily goal must be between 5 and 120 minutes.')).toBeTruthy()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows error when daily goal exceeds 120', async () => {
    render(<AccountForm profile={baseProfile} />)
    await userEvent.clear(screen.getByLabelText('Daily goal (minutes)'))
    await userEvent.type(screen.getByLabelText('Daily goal (minutes)'), '121')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Daily goal must be between 5 and 120 minutes.')).toBeTruthy()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows error when daily goal is not a number', async () => {
    render(<AccountForm profile={baseProfile} />)
    await userEvent.clear(screen.getByLabelText('Daily goal (minutes)'))
    await userEvent.type(screen.getByLabelText('Daily goal (minutes)'), 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Daily goal must be between 5 and 120 minutes.')).toBeTruthy()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  // --- Save success ---

  it('calls fetch with correct payload on save', async () => {
    mockFetchSuccess()
    render(<AccountForm profile={baseProfile} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/account/update',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: 'Nicolas',
          current_level: 'B1',
          daily_goal_minutes: 15,
        }),
      })
    )
  })

  it('sends updated display name in payload', async () => {
    mockFetchSuccess()
    render(<AccountForm profile={baseProfile} />)
    await userEvent.clear(screen.getByLabelText('Display name'))
    await userEvent.type(screen.getByLabelText('Display name'), 'Carlos')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string)
    expect(body.display_name).toBe('Carlos')
  })

  it('sends updated level in payload when level is changed', async () => {
    mockFetchSuccess()
    render(<AccountForm profile={baseProfile} />)
    await userEvent.click(screen.getByRole('button', { name: /^B2/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string)
    expect(body.current_level).toBe('B2')
  })

  it('omits display_name from payload when field is empty', async () => {
    mockFetchSuccess()
    render(<AccountForm profile={{ ...baseProfile, display_name: null }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string)
    expect(body.display_name).toBeUndefined()
  })

  it('shows "Changes saved." after successful save', async () => {
    mockFetchSuccess()
    render(<AccountForm profile={baseProfile} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(screen.getByText('Changes saved.')).toBeTruthy()
    })
  })

  it('shows "Saving…" label on button while request is in flight', async () => {
    // Use a promise we control so we can inspect state mid-flight
    let resolveFetch!: () => void
    vi.mocked(global.fetch).mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = () => resolve({ ok: true, json: async () => ({ ok: true }) } as Response)
      })
    )
    render(<AccountForm profile={baseProfile} />)
    // Start click but don't await fully
    const clickPromise = userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(screen.queryByText('Saving…')).toBeTruthy()
    })
    resolveFetch()
    await clickPromise
  })

  // --- Save error ---

  it('shows API error message on failed save', async () => {
    mockFetchError('Server is unavailable')
    render(<AccountForm profile={baseProfile} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(screen.getByText('Server is unavailable')).toBeTruthy()
    })
  })

  it('does not show "Changes saved." after failed save', async () => {
    mockFetchError()
    render(<AccountForm profile={baseProfile} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(screen.queryByText('Changes saved.')).toBeNull()
    })
  })

  // --- Character count ---

  it('does not show character count when display name is short', () => {
    render(<AccountForm profile={baseProfile} />)
    // "Nicolas" is 7 chars, well below threshold of 35
    expect(screen.queryByText(/\/50/)).toBeNull()
  })

  it('shows character count when display name is 35 or more chars', async () => {
    render(<AccountForm profile={baseProfile} />)
    const input = screen.getByLabelText('Display name')
    await userEvent.clear(input)
    await userEvent.type(input, 'A'.repeat(35))
    expect(screen.getByText('35/50')).toBeTruthy()
  })

  // --- Saved state cleared on edit ---

  it('clears "Changes saved." when display name is edited', async () => {
    mockFetchSuccess()
    render(<AccountForm profile={baseProfile} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.getByText('Changes saved.')).toBeTruthy())
    await userEvent.type(screen.getByLabelText('Display name'), 'x')
    expect(screen.queryByText('Changes saved.')).toBeNull()
  })

  it('clears "Changes saved." when level is changed', async () => {
    mockFetchSuccess()
    render(<AccountForm profile={baseProfile} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.getByText('Changes saved.')).toBeTruthy())
    await userEvent.click(screen.getByRole('button', { name: /^A2/ }))
    expect(screen.queryByText('Changes saved.')).toBeNull()
  })
})
