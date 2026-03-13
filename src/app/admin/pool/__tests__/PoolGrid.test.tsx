import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PoolGrid } from '../PoolGrid'

const modules = [
  { id: 'mod-1', title: 'Module 1: Test Module', order_index: 1 },
]

const unitsByModule = {
  'mod-1': [{ id: 'unit-1', module_id: 'mod-1', title: 'Unit 1', order_index: 1 }],
}

const conceptsByUnit = {
  'unit-1': [{ id: 'con-1', unit_id: 'unit-1', title: 'Test Concept' }],
}

const allTypes = ['gap_fill', 'translation', 'transformation', 'error_correction', 'sentence_builder', 'free_write']
const generatableTypes = ['gap_fill', 'translation', 'transformation', 'error_correction']

describe('PoolGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders module titles collapsed by default', () => {
    render(
      <PoolGrid
        modules={modules}
        unitsByModule={unitsByModule}
        conceptsByUnit={conceptsByUnit}
        counts={{ 'con-1:gap_fill': 9, 'con-1:translation': 3 }}
        cap={15}
        allTypes={allTypes}
        generatableTypes={generatableTypes}
      />,
    )
    expect(screen.getByText('Module 1: Test Module')).toBeInTheDocument()
    // Concept should not be visible when collapsed
    expect(screen.queryByText('Test Concept')).not.toBeInTheDocument()
  })

  it('expands module on click and shows concept counts', async () => {
    const user = userEvent.setup()
    render(
      <PoolGrid
        modules={modules}
        unitsByModule={unitsByModule}
        conceptsByUnit={conceptsByUnit}
        counts={{ 'con-1:gap_fill': 9, 'con-1:translation': 3 }}
        cap={15}
        allTypes={allTypes}
        generatableTypes={generatableTypes}
      />,
    )

    await user.click(screen.getByText('Module 1: Test Module'))
    expect(screen.getByText('Test Concept')).toBeInTheDocument()
    expect(screen.getByText('9/15')).toBeInTheDocument()
    expect(screen.getByText('3/15')).toBeInTheDocument()
  })

  it('shows "+" button for generatable types under cap', async () => {
    const user = userEvent.setup()
    render(
      <PoolGrid
        modules={modules}
        unitsByModule={unitsByModule}
        conceptsByUnit={conceptsByUnit}
        counts={{ 'con-1:gap_fill': 5 }}
        cap={15}
        allTypes={allTypes}
        generatableTypes={generatableTypes}
      />,
    )

    await user.click(screen.getByText('Module 1: Test Module'))
    expect(screen.getByTestId('generate-con-1-gap_fill')).toBeInTheDocument()
  })

  it('fires generate API call on "+" click and updates count', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'new-ex', cached: false }), { status: 200 }),
    )

    render(
      <PoolGrid
        modules={modules}
        unitsByModule={unitsByModule}
        conceptsByUnit={conceptsByUnit}
        counts={{ 'con-1:gap_fill': 5 }}
        cap={15}
        allTypes={allTypes}
        generatableTypes={generatableTypes}
      />,
    )

    await user.click(screen.getByText('Module 1: Test Module'))
    await user.click(screen.getByTestId('generate-con-1-gap_fill'))

    expect(global.fetch).toHaveBeenCalledWith('/api/exercises/generate', expect.objectContaining({
      method: 'POST',
    }))

    // Count should update from 5 to 6
    expect(await screen.findByText('6/15')).toBeInTheDocument()
  })

  it('does not increment count when cached response', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'existing-ex', cached: true }), { status: 200 }),
    )

    render(
      <PoolGrid
        modules={modules}
        unitsByModule={unitsByModule}
        conceptsByUnit={conceptsByUnit}
        counts={{ 'con-1:gap_fill': 5 }}
        cap={15}
        allTypes={allTypes}
        generatableTypes={generatableTypes}
      />,
    )

    await user.click(screen.getByText('Module 1: Test Module'))
    await user.click(screen.getByTestId('generate-con-1-gap_fill'))

    // Count should stay at 5 since it was a cached response
    expect(await screen.findByText('5/15')).toBeInTheDocument()
  })

  it('shows 0/15 for types with no exercises', async () => {
    const user = userEvent.setup()
    render(
      <PoolGrid
        modules={modules}
        unitsByModule={unitsByModule}
        conceptsByUnit={conceptsByUnit}
        counts={{}}
        cap={15}
        allTypes={allTypes}
        generatableTypes={generatableTypes}
      />,
    )

    await user.click(screen.getByText('Module 1: Test Module'))
    // All 6 types should show 0/15
    const zeroCountElements = screen.getAllByText('0/15')
    expect(zeroCountElements.length).toBe(6)
  })
})
