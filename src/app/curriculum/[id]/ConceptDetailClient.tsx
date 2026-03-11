'use client'

import { useState } from 'react'

export function ExpandableExplanation({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <p
        className="text-foreground text-sm leading-relaxed"
        style={
          expanded
            ? undefined
            : {
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical' as const,
              }
        }
      >
        {text}
      </p>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-xs font-medium"
        style={{
          color: 'var(--d5-terracotta)',
          background: 'none',
          border: 'none',
          padding: '0.5rem 0 0',
          cursor: 'pointer',
        }}
      >
        {expanded ? 'Mostrar menos' : 'Leer más…'}
      </button>
    </div>
  )
}
