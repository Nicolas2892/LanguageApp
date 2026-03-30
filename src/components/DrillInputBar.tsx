'use client'

import { RefObject } from 'react'
import { Button } from '@/components/ui/button'

interface DrillInputBarProps {
  inputRef: RefObject<HTMLInputElement | null>
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  disabled: boolean
  buttonLabel?: string
}

/**
 * Inline input bar for verb/vocab drill sessions.
 * Renders in document flow — SessionShell handles viewport positioning.
 */
export function DrillInputBar({
  inputRef,
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  buttonLabel = 'Comprobar →',
}: DrillInputBarProps) {
  return (
    <div className="space-y-3">
      <div className="senda-dashed-input">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit() }}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full text-base border-0 bg-transparent focus:outline-none focus-visible:ring-0"
        />
      </div>

      <Button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full rounded-full active:scale-95 transition-transform"
      >
        {buttonLabel}
      </Button>
    </div>
  )
}
