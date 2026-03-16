import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OfflineFeedbackPanel } from '../OfflineFeedbackPanel'

describe('OfflineFeedbackPanel', () => {
  it('shows the user answer', () => {
    render(<OfflineFeedbackPanel userAnswer="Mi respuesta" onNext={vi.fn()} />)
    expect(screen.getByText('Mi respuesta')).toBeInTheDocument()
  })

  it('shows neutral feedback message', () => {
    render(<OfflineFeedbackPanel userAnswer="test" onNext={vi.fn()} />)
    expect(screen.getByText('Respuesta registrada')).toBeInTheDocument()
    expect(screen.getByText(/se calificará cuando vuelvas a conectarte/)).toBeInTheDocument()
  })

  it('calls onNext when clicking Siguiente', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(<OfflineFeedbackPanel userAnswer="test" onNext={onNext} />)
    await user.click(screen.getByText(/Siguiente/))
    expect(onNext).toHaveBeenCalledOnce()
  })
})
