import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountForm } from '../AccountForm'
import { ThemeProvider } from '@/components/ThemeProvider'
import type { Profile } from '@/lib/supabase/types'

const baseProfile: Profile = {
  id: 'user-1',
  display_name: 'Nicolas',
  current_level: 'B1',
  computed_level: 'B1',
  daily_goal_minutes: 15,
  streak: 5,
  last_studied_date: '2026-03-01',
  created_at: '2026-01-01T00:00:00Z',
  onboarding_completed: true,
  push_subscription: null,
  theme_preference: 'system',
}

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider initialTheme="system">{ui}</ThemeProvider>
  )
}

const baseMastery = {
  masteredByLevel: { B1: 3, B2: 0 },
  totalByLevel: { B1: 6, B2: 12, C1: 3 },
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
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Nicolas')
  })

  it('pre-fills daily goal from profile', () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    expect((screen.getByLabelText('Daily goal (minutes)') as HTMLInputElement).value).toBe('15')
  })

  it('shows "Save changes" as initial button text', () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy()
  })

  // --- Computed level display ---

  it('displays the computed level badge', () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    // 'B1' appears in both the badge and the breakdown row — getAllByText is intentional
    expect(screen.getAllByText('B1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Intermediate')).toBeTruthy()
  })

  it('shows mastery breakdown per CEFR level', () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    expect(screen.getByText(/3 of 6 mastered/)).toBeTruthy()
    expect(screen.getByText(/0 of 12 mastered/)).toBeTruthy()
  })

  it('shows B2 label when computed_level is B2', () => {
    const profile = { ...baseProfile, computed_level: 'B2' }
    renderWithTheme(<AccountForm profile={profile} mastery={baseMastery} />)
    expect(screen.getByText('Advanced')).toBeTruthy()
  })

  it('shows C1 label when computed_level is C1', () => {
    const profile = { ...baseProfile, computed_level: 'C1' }
    renderWithTheme(<AccountForm profile={profile} mastery={baseMastery} />)
    expect(screen.getByText('Proficient')).toBeTruthy()
  })

  it('does not render level picker buttons', () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    expect(screen.queryByRole('button', { name: /^A2/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^B1/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^B2/ })).toBeNull()
  })

  // --- Validation (client-side) ---

  it('shows error when daily goal is below 5', async () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.clear(screen.getByLabelText('Daily goal (minutes)'))
    await userEvent.type(screen.getByLabelText('Daily goal (minutes)'), '4')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Daily goal must be between 5 and 120 minutes.')).toBeTruthy()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows error when daily goal exceeds 120', async () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.clear(screen.getByLabelText('Daily goal (minutes)'))
    await userEvent.type(screen.getByLabelText('Daily goal (minutes)'), '121')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Daily goal must be between 5 and 120 minutes.')).toBeTruthy()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows error when daily goal is not a number', async () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.clear(screen.getByLabelText('Daily goal (minutes)'))
    await userEvent.type(screen.getByLabelText('Daily goal (minutes)'), 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Daily goal must be between 5 and 120 minutes.')).toBeTruthy()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  // --- Save success ---

  it('calls fetch with correct payload on save (no current_level)', async () => {
    mockFetchSuccess()
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/account/update',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: 'Nicolas',
          daily_goal_minutes: 15,
        }),
      })
    )
  })

  it('does not include current_level in save payload', async () => {
    mockFetchSuccess()
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string)
    expect(body.current_level).toBeUndefined()
  })

  it('sends updated display name in payload', async () => {
    mockFetchSuccess()
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.clear(screen.getByLabelText('Display name'))
    await userEvent.type(screen.getByLabelText('Display name'), 'Carlos')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string)
    expect(body.display_name).toBe('Carlos')
  })

  it('omits display_name from payload when field is empty', async () => {
    mockFetchSuccess()
    renderWithTheme(<AccountForm profile={{ ...baseProfile, display_name: null }} mastery={baseMastery} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string)
    expect(body.display_name).toBeUndefined()
  })

  it('shows "Changes saved." after successful save', async () => {
    mockFetchSuccess()
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(screen.getByText('Changes saved.')).toBeTruthy()
    })
  })

  it('shows "Saving…" label on button while request is in flight', async () => {
    let resolveFetch!: () => void
    vi.mocked(global.fetch).mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = () => resolve({ ok: true, json: async () => ({ ok: true }) } as Response)
      })
    )
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
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
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(screen.getByText('Server is unavailable')).toBeTruthy()
    })
  })

  it('does not show "Changes saved." after failed save', async () => {
    mockFetchError()
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(screen.queryByText('Changes saved.')).toBeNull()
    })
  })

  // --- Character count ---

  it('does not show character count when display name is short', () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    expect(screen.queryByText(/\/50/)).toBeNull()
  })

  it('shows character count when display name is 35 or more chars', async () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    const input = screen.getByLabelText('Display name')
    await userEvent.clear(input)
    await userEvent.type(input, 'A'.repeat(35))
    expect(screen.getByText('35/50')).toBeTruthy()
  })

  // --- Theme toggle ---

  it('renders Light, System, and Dark theme buttons', () => {
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    expect(screen.getByRole('button', { name: /light/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /system/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /dark/i })).toBeTruthy()
  })

  it('clicking Dark theme button fires fetch to persist preference', async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response)
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.click(screen.getByRole('button', { name: /dark/i }))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/account/update',
      expect.objectContaining({
        body: JSON.stringify({ theme_preference: 'dark' }),
      })
    )
  })

  // --- Saved state cleared on edit ---

  it('clears "Changes saved." when display name is edited', async () => {
    mockFetchSuccess()
    renderWithTheme(<AccountForm profile={baseProfile} mastery={baseMastery} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.getByText('Changes saved.')).toBeTruthy())
    await userEvent.type(screen.getByLabelText('Display name'), 'x')
    expect(screen.queryByText('Changes saved.')).toBeNull()
  })
})
