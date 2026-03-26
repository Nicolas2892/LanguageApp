import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WordScoreChips } from '../WordScoreChips'
import type { WordScore } from '@/lib/azure/client'

function makeWord(word: string, accuracyScore: number): WordScore {
  return { word, accuracyScore, phonemes: [] }
}

describe('WordScoreChips', () => {
  it('renders a chip for each word', () => {
    const words = [makeWord('hola', 90), makeWord('mundo', 60)]
    render(<WordScoreChips words={words} />)
    expect(screen.getByText('hola')).toBeInTheDocument()
    expect(screen.getByText('mundo')).toBeInTheDocument()
  })

  it('applies green class for score >= 80', () => {
    render(<WordScoreChips words={[makeWord('bien', 85)]} />)
    const chip = screen.getByText('bien')
    expect(chip.className).toMatch(/bg-green/)
  })

  it('applies amber class for score 50–79', () => {
    render(<WordScoreChips words={[makeWord('regular', 65)]} />)
    const chip = screen.getByText('regular')
    expect(chip.className).toMatch(/bg-amber/)
  })

  it('applies red class for score < 50', () => {
    render(<WordScoreChips words={[makeWord('mal', 30)]} />)
    const chip = screen.getByText('mal')
    expect(chip.className).toMatch(/bg-red/)
  })

  it('renders nothing when words array is empty', () => {
    const { container } = render(<WordScoreChips words={[]} />)
    expect(container.querySelectorAll('span')).toHaveLength(0)
  })

  it('sets title with word and score', () => {
    render(<WordScoreChips words={[makeWord('test', 75)]} />)
    expect(screen.getByTitle('test: 75%')).toBeInTheDocument()
  })
})
