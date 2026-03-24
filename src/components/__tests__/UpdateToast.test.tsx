import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { UpdateToast } from '../UpdateToast'

describe('UpdateToast', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders update message and buttons', () => {
    render(<UpdateToast onUpdate={vi.fn()} onDismiss={vi.fn()} />)

    expect(screen.getByText('Actualización Disponible')).toBeInTheDocument()
    expect(screen.getByText('Pulsa para cargar la última versión.')).toBeInTheDocument()
    expect(screen.getByText('Actualizar')).toBeInTheDocument()
    expect(screen.getByLabelText('Cerrar')).toBeInTheDocument()
  })

  it('has role="status" for accessibility', () => {
    render(<UpdateToast onUpdate={vi.fn()} onDismiss={vi.fn()} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('calls onUpdate when Actualizar is clicked', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<UpdateToast onUpdate={onUpdate} onDismiss={vi.fn()} />)

    await user.click(screen.getByText('Actualizar'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when X is clicked', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()
    render(<UpdateToast onUpdate={vi.fn()} onDismiss={onDismiss} />)

    await user.click(screen.getByLabelText('Cerrar'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
