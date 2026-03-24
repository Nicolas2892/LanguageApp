import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/lib/platform/network', () => ({
  isOnline: () => true,
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: (props: { children: React.ReactNode; href: string; className?: string }) => {
    const { children, href, ...rest } = props
    return <a href={href} {...rest}>{children}</a>
  },
}))

import * as Sentry from '@sentry/nextjs'
import VocabSessionError from '../error'

describe('vocab/session error.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders branded fallback UI', () => {
    render(<VocabSessionError error={new Error('test')} reset={() => {}} />)
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
  })

  it('calls Sentry.captureException', () => {
    const err = new Error('session crash')
    render(<VocabSessionError error={err} reset={() => {}} />)
    expect(Sentry.captureException).toHaveBeenCalledWith(err)
  })

  it('has a Reintentar button that calls reset', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    render(<VocabSessionError error={new Error('test')} reset={reset} />)
    await user.click(screen.getByText('Reintentar'))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('has a navigation link to vocab page', () => {
    render(<VocabSessionError error={new Error('test')} reset={() => {}} />)
    const link = screen.getByRole('link', { name: /vocabulario/i })
    expect(link).toHaveAttribute('href', '/verbs')
  })
})
