import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnnotatedText } from '../AnnotatedText'
import type { AnnotationSpan } from '@/lib/supabase/types'

describe('AnnotatedText', () => {
  it('renders plain text when annotations is null', () => {
    render(<AnnotatedText text="Hola mundo" annotations={null} />)
    expect(screen.getByText('Hola mundo')).toBeTruthy()
  })

  it('renders plain text when annotations is empty array', () => {
    render(<AnnotatedText text="Hola mundo" annotations={[]} />)
    expect(screen.getByText('Hola mundo')).toBeTruthy()
  })

  it('renders plain text when annotations is undefined', () => {
    render(<AnnotatedText text="Hola mundo" annotations={undefined} />)
    expect(screen.getByText('Hola mundo')).toBeTruthy()
  })

  it('applies orange border and text class to subjunctive spans', () => {
    const annotations: AnnotationSpan[] = [
      { text: 'Espero que ', form: null },
      { text: 'vengas', form: 'subjunctive' },
      { text: ' mañana.', form: null },
    ]
    render(<AnnotatedText text="Espero que vengas mañana." annotations={annotations} />)
    const subjSpan = screen.getByTitle('Subjuntivo')
    expect(subjSpan.textContent).toBe('vengas')
    expect(subjSpan.className).toContain('border-violet-400')
    expect(subjSpan.className).toContain('text-violet-700')
  })

  it('applies no special class to null-form spans', () => {
    const annotations: AnnotationSpan[] = [
      { text: 'Espero que ', form: null },
    ]
    const { container } = render(<AnnotatedText text="Espero que " annotations={annotations} />)
    // No span with title "Subjunctive"
    const subjSpans = container.querySelectorAll('[title="Subjunctive"]')
    expect(subjSpans.length).toBe(0)
  })

  it('applies no special class to indicative spans', () => {
    const annotations: AnnotationSpan[] = [
      { text: 'viene', form: 'indicative' },
    ]
    const { container } = render(<AnnotatedText text="viene" annotations={annotations} />)
    const subjSpans = container.querySelectorAll('[title="Subjunctive"]')
    expect(subjSpans.length).toBe(0)
  })

  it('sets title="Subjunctive" on subjunctive spans', () => {
    const annotations: AnnotationSpan[] = [
      { text: 'llegues', form: 'subjunctive' },
    ]
    render(<AnnotatedText text="llegues" annotations={annotations} />)
    expect(screen.getByTitle('Subjuntivo')).toBeTruthy()
  })

  it('highlights multiple subjunctive spans', () => {
    const annotations: AnnotationSpan[] = [
      { text: 'Aunque ', form: null },
      { text: 'llueva', form: 'subjunctive' },
      { text: ', quiero que ', form: null },
      { text: 'vengas', form: 'subjunctive' },
      { text: '.', form: null },
    ]
    render(<AnnotatedText text="Aunque llueva, quiero que vengas." annotations={annotations} />)
    const subjSpans = screen.getAllByTitle('Subjuntivo')
    expect(subjSpans.length).toBe(2)
    expect(subjSpans[0].textContent).toBe('llueva')
    expect(subjSpans[1].textContent).toBe('vengas')
  })

  it('concatenating all span texts reproduces original text', () => {
    const annotations: AnnotationSpan[] = [
      { text: 'Espero que ', form: null },
      { text: 'vengas', form: 'subjunctive' },
      { text: ' pronto.', form: null },
    ]
    const { container } = render(
      <AnnotatedText text="Espero que vengas pronto." annotations={annotations} />
    )
    expect(container.textContent).toBe('Espero que vengas pronto.')
  })
})
