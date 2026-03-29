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
 * Fixed bottom input bar for verb/vocab drill sessions.
 * Mobile (<lg): pinned above keyboard. Desktop (lg+): renders inline.
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
    <div
      className="
        fixed bottom-0 inset-x-0 z-30
        bg-background border-t border-border
        px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]
        lg:static lg:z-auto lg:bg-transparent lg:border-0 lg:p-0
      "
    >
      <div className="max-w-2xl mx-auto lg:max-w-none space-y-3">
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
    </div>
  )
}
