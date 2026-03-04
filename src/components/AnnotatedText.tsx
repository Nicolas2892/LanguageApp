import type { AnnotationSpan } from '@/lib/supabase/types'

interface Props {
  text: string
  annotations: AnnotationSpan[] | null | undefined
}

export function AnnotatedText({ text, annotations }: Props) {
  if (!annotations || annotations.length === 0) {
    return <span>{text}</span>
  }
  return (
    <>
      {annotations.map((span, i) =>
        span.form === 'subjunctive' ? (
          <span
            key={i}
            className="border-b-2 border-violet-400 text-violet-700"
            title="Subjunctive"
          >
            {span.text}
          </span>
        ) : (
          <span key={i}>{span.text}</span>
        )
      )}
    </>
  )
}
