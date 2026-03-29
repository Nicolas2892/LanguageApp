import { GapFill } from './GapFill'
import { TextAnswer } from './TextAnswer'
import { SentenceBuilder } from './SentenceBuilder'
import { ErrorCorrection } from './ErrorCorrection'
import { ListeningComprehension } from './ListeningComprehension'
import { Proofreading } from './Proofreading'
import { RegisterShift } from './RegisterShift'
import type { Exercise } from '@/lib/supabase/types'

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled: boolean
  /** Portal target for rendering input in a fixed bottom bar (mobile only). */
  portalTarget?: HTMLDivElement | null
}

export function ExerciseRenderer({ exercise, onSubmit, disabled, portalTarget }: Props) {
  switch (exercise.type) {
    case 'gap_fill':
      return <GapFill exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
    case 'sentence_builder':
      return <SentenceBuilder exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
    case 'error_correction':
      return <ErrorCorrection exercise={exercise} onSubmit={onSubmit} disabled={disabled} portalTarget={portalTarget} />
    case 'listening':
      return <ListeningComprehension exercise={exercise} onSubmit={onSubmit} disabled={disabled} portalTarget={portalTarget} />
    case 'proofreading':
      return <Proofreading exercise={exercise} onSubmit={onSubmit} disabled={disabled} portalTarget={portalTarget} />
    case 'register_shift':
      return <RegisterShift exercise={exercise} onSubmit={onSubmit} disabled={disabled} portalTarget={portalTarget} />
    default:
      // transformation, translation, free_write
      return <TextAnswer exercise={exercise} onSubmit={onSubmit} disabled={disabled} portalTarget={portalTarget} />
  }
}
