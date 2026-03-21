import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MasteryChip } from '../MasteryChip'
import { MASTERY_BADGE } from '@/lib/mastery/badge'

const LEARNING_MILESTONES = {
  srsReady: false,
  intervalDays: 5,
  correctNonGapFill: 1,
  uniqueTypes: 1,
  correctProductionTypeLabels: ['Traducción'],
}

describe('MasteryChip', () => {
  it('renders badge label for new state', () => {
    render(
      <MasteryChip
        masteryState="new"
        badge={MASTERY_BADGE.new}
        nudgeText="Empieza con una sesión de práctica"
        milestones={null}
      />
    )
    expect(screen.getByTestId('mastery-chip')).toHaveTextContent('Nuevo')
  })

  it('renders badge label for learning state', () => {
    render(
      <MasteryChip
        masteryState="learning"
        badge={MASTERY_BADGE.learning}
        nudgeText="16 días más de repaso para dominar"
        milestones={LEARNING_MILESTONES}
      />
    )
    expect(screen.getByTestId('mastery-chip')).toHaveTextContent('Aprendiendo')
  })

  it('renders badge label for mastered state', () => {
    render(
      <MasteryChip
        masteryState="mastered"
        badge={MASTERY_BADGE.mastered}
        nudgeText={null}
        milestones={null}
      />
    )
    expect(screen.getByTestId('mastery-chip')).toHaveTextContent('Dominado')
  })

  it('shows nudge text when provided', () => {
    render(
      <MasteryChip
        masteryState="new"
        badge={MASTERY_BADGE.new}
        nudgeText="Empieza con una sesión de práctica"
        milestones={null}
      />
    )
    expect(screen.getByTestId('nudge-text')).toHaveTextContent('Empieza con una sesión de práctica')
  })

  it('hides nudge text when null', () => {
    render(
      <MasteryChip
        masteryState="mastered"
        badge={MASTERY_BADGE.mastered}
        nudgeText={null}
        milestones={null}
      />
    )
    expect(screen.queryByTestId('nudge-text')).not.toBeInTheDocument()
  })

  it('shows chevron only in learning state', () => {
    const { rerender } = render(
      <MasteryChip
        masteryState="learning"
        badge={MASTERY_BADGE.learning}
        nudgeText="16 días"
        milestones={LEARNING_MILESTONES}
      />
    )
    expect(screen.getByTestId('chevron')).toBeInTheDocument()

    rerender(
      <MasteryChip
        masteryState="new"
        badge={MASTERY_BADGE.new}
        nudgeText="Empieza"
        milestones={null}
      />
    )
    expect(screen.queryByTestId('chevron')).not.toBeInTheDocument()

    rerender(
      <MasteryChip
        masteryState="mastered"
        badge={MASTERY_BADGE.mastered}
        nudgeText={null}
        milestones={null}
      />
    )
    expect(screen.queryByTestId('chevron')).not.toBeInTheDocument()
  })

  it('expands milestones on click in learning state', async () => {
    const user = userEvent.setup()
    render(
      <MasteryChip
        masteryState="learning"
        badge={MASTERY_BADGE.learning}
        nudgeText="16 días"
        milestones={LEARNING_MILESTONES}
      />
    )
    const milestones = screen.getByTestId('milestones')
    expect(milestones).toHaveStyle({ maxHeight: '0' })

    await user.click(screen.getByTestId('mastery-chip'))
    expect(milestones).toHaveStyle({ maxHeight: '10rem' })
  })

  it('does not expand for new state', async () => {
    const user = userEvent.setup()
    render(
      <MasteryChip
        masteryState="new"
        badge={MASTERY_BADGE.new}
        nudgeText="Empieza"
        milestones={null}
      />
    )
    expect(screen.queryByTestId('milestones')).not.toBeInTheDocument()
    // Click should not crash
    await user.click(screen.getByTestId('mastery-chip'))
    expect(screen.queryByTestId('milestones')).not.toBeInTheDocument()
  })

  it('shows CheckCircle2 for met SRS gate and Circle for unmet', () => {
    render(
      <MasteryChip
        masteryState="learning"
        badge={MASTERY_BADGE.learning}
        nudgeText="test"
        milestones={{ ...LEARNING_MILESTONES, srsReady: false }}
      />
    )
    expect(screen.getByTestId('icon-circle-srs')).toBeInTheDocument()
  })

  it('shows CheckCircle2 when SRS is ready', () => {
    render(
      <MasteryChip
        masteryState="learning"
        badge={MASTERY_BADGE.learning}
        nudgeText="test"
        milestones={{ ...LEARNING_MILESTONES, srsReady: true, intervalDays: 21 }}
      />
    )
    expect(screen.getByTestId('icon-check-srs')).toBeInTheDocument()
  })

  it('renders type chips for completed production types', async () => {
    const user = userEvent.setup()
    render(
      <MasteryChip
        masteryState="learning"
        badge={MASTERY_BADGE.learning}
        nudgeText="test"
        milestones={{
          ...LEARNING_MILESTONES,
          correctProductionTypeLabels: ['Traducción', 'Transformación'],
        }}
      />
    )
    // Expand to see chips
    await user.click(screen.getByTestId('mastery-chip'))
    const chips = screen.getAllByTestId('type-chip')
    expect(chips).toHaveLength(2)
    expect(chips[0]).toHaveTextContent('Traducción')
    expect(chips[1]).toHaveTextContent('Transformación')
  })
})
