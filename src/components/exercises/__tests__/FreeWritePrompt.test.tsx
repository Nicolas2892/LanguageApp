import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FreeWritePrompt } from '../FreeWritePrompt'

const baseProps = {
  prompt: 'Write about a typical day in your city.',
  conceptTitle: 'Subjuntivo presente',
  onSubmit: vi.fn(),
  onRefreshPrompt: vi.fn(),
  disabled: false,
  loadingPrompt: false,
}

function words(n: number) {
  return Array(n).fill('palabra').join(' ')
}

describe('FreeWritePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Rendering ---

  it('renders the concept title', () => {
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByText('Subjuntivo presente')).toBeTruthy()
  })

  it('renders the AI prompt text when not loading', () => {
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByText('Write about a typical day in your city.')).toBeTruthy()
  })

  it('hides prompt text and shows skeleton while loading', () => {
    render(<FreeWritePrompt {...baseProps} loadingPrompt={true} />)
    expect(screen.queryByText('Write about a typical day in your city.')).toBeNull()
  })

  it('shows initial word counter at 0', () => {
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByText('0 / 200 words')).toBeTruthy()
  })

  // --- Word counter updates ---

  it('updates word counter as user types', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: 'hola mundo' } })
    expect(screen.getByText('2 / 200 words')).toBeTruthy()
  })

  it('counts words correctly for multi-space input', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: '  uno  dos  tres  ' } })
    expect(screen.getByText('3 / 200 words')).toBeTruthy()
  })

  // --- Word limit colour states ---

  it('counter is muted (no warning class) when under 150 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: words(50) } })
    const counter = screen.getByText('50 / 200 words')
    expect(counter.className).toContain('text-muted-foreground')
    expect(counter.className).not.toContain('text-amber-500')
    expect(counter.className).not.toContain('text-red-500')
  })

  it('counter turns amber at 150 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: words(150) } })
    const counter = screen.getByText('150 / 200 words')
    expect(counter.className).toContain('text-amber-500')
  })

  it('counter turns red above 200 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: words(201) } })
    const counter = screen.getByText('201 / 200 words')
    expect(counter.className).toContain('text-red-500')
  })

  // --- Submit button disabled states ---

  it('Submit is disabled when answer is empty', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const submit = screen.getByText('Submit →')
    expect(submit.closest('button')).toBeDisabled()
  })

  it('Submit is disabled when answer is below 20 words (underMinimum)', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: words(10) } })
    expect(screen.getByText('Submit →').closest('button')).toBeDisabled()
  })

  it('Submit is enabled at exactly 20 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: words(20) } })
    expect(screen.getByText('Submit →').closest('button')).not.toBeDisabled()
  })

  it('Submit is enabled at exactly 200 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: words(200) } })
    expect(screen.getByText('Submit →').closest('button')).not.toBeDisabled()
  })

  it('Submit is disabled above 200 words (overLimit)', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: words(201) } })
    expect(screen.getByText('Submit →').closest('button')).toBeDisabled()
  })

  // --- onSubmit callback ---

  it('calls onSubmit with trimmed answer when valid', async () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: '  ' + words(25) + '  ' } })
    await userEvent.click(screen.getByText('Submit →'))
    expect(baseProps.onSubmit).toHaveBeenCalledOnce()
    expect(baseProps.onSubmit).toHaveBeenCalledWith(words(25))
  })

  it('does not call onSubmit when under 20 words', async () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: words(5) } })
    await userEvent.click(screen.getByText('Submit →'))
    expect(baseProps.onSubmit).not.toHaveBeenCalled()
  })

  it('does not call onSubmit when over 200 words', async () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Write your answer in Spanish…')
    fireEvent.change(textarea, { target: { value: words(201) } })
    await userEvent.click(screen.getByText('Submit →'))
    expect(baseProps.onSubmit).not.toHaveBeenCalled()
  })

  // --- Refresh prompt ---

  it('calls onRefreshPrompt when refresh button is clicked', async () => {
    render(<FreeWritePrompt {...baseProps} />)
    await userEvent.click(screen.getByText('Generate different prompt'))
    expect(baseProps.onRefreshPrompt).toHaveBeenCalledOnce()
  })

  // --- Disabled prop ---

  it('disables both buttons when disabled=true', () => {
    render(<FreeWritePrompt {...baseProps} disabled={true} />)
    expect(screen.getByText('Generate different prompt').closest('button')).toBeDisabled()
    expect(screen.getByText('Submit →').closest('button')).toBeDisabled()
  })

  it('disables textarea when disabled=true', () => {
    render(<FreeWritePrompt {...baseProps} disabled={true} />)
    expect(screen.getByPlaceholderText('Write your answer in Spanish…')).toBeDisabled()
  })

  it('disables textarea and buttons while loading prompt', () => {
    render(<FreeWritePrompt {...baseProps} loadingPrompt={true} />)
    expect(screen.getByPlaceholderText('Write your answer in Spanish…')).toBeDisabled()
    expect(screen.getByText('Generate different prompt').closest('button')).toBeDisabled()
  })
})
