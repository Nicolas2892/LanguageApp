import { GapFill } from './GapFill'
import { TextAnswer } from './TextAnswer'
import { SentenceBuilder } from './SentenceBuilder'
import { ErrorCorrection } from './ErrorCorrection'
import type { Exercise } from '@/lib/supabase/types'

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled: boolean
}

export function ExerciseRenderer({ exercise, onSubmit, disabled }: Props) {
  switch (exercise.type) {
    case 'gap_fill':
      return <GapFill exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
    case 'sentence_builder':
      return <SentenceBuilder exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
    case 'error_correction':
      return <ErrorCorrection exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
    default:
      // transformation, translation, free_write
      return <TextAnswer exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
  }
}
