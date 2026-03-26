'use client'

import { RefreshCw, X } from 'lucide-react'

interface Props {
  onUpdate: () => void
  onDismiss: () => void
}

export function UpdateToast({ onUpdate, onDismiss }: Props) {
  return (
    <div
      className="fixed left-4 right-4 z-50 mx-auto max-w-sm senda-card flex items-center gap-3 animate-card-in
                 bottom-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:bottom-6"
      role="status"
    >
      <RefreshCw
        size={20}
        strokeWidth={2}
        className="shrink-0"
        style={{ color: 'var(--d5-terracotta)' }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="senda-heading text-sm">Actualización Disponible</p>
        <p className="text-xs" style={{ color: 'var(--d5-warm)' }}>
          Pulsa para cargar la última versión.
        </p>
      </div>
      <button
        onClick={onUpdate}
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Actualizar
      </button>
      <button
        onClick={onDismiss}
        className="shrink-0 text-[var(--d5-muted)] hover:text-foreground"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
