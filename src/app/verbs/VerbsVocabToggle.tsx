'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface Props {
  verbContent: React.ReactNode
  vocabContent: React.ReactNode
}

export function VerbsVocabToggle({ verbContent, vocabContent }: Props) {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'vocab' ? 'vocab' : 'verbs'
  const [tab, setTab] = useState<'verbs' | 'vocab'>(initialTab)

  return (
    <>
      {/* Segmented control */}
      <div
        className="flex rounded-full p-1 mx-auto w-fit"
        style={{ background: 'var(--d5-pill-bg)' }}
      >
        <button
          onClick={() => setTab('verbs')}
          className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all"
          style={{
            background: tab === 'verbs' ? 'var(--d5-terracotta)' : 'transparent',
            color: tab === 'verbs' ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
          }}
        >
          Verbos
        </button>
        <button
          onClick={() => setTab('vocab')}
          className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all"
          style={{
            background: tab === 'vocab' ? 'var(--d5-terracotta)' : 'transparent',
            color: tab === 'vocab' ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
          }}
        >
          Vocabulario
        </button>
      </div>

      {/* Tab content */}
      {tab === 'verbs' ? verbContent : vocabContent}
    </>
  )
}
