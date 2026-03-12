'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="space-y-4 text-center py-8">
          <p className="text-lg font-semibold">Algo salió mal</p>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message ?? 'Ha ocurrido un error inesperado.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="senda-cta"
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
