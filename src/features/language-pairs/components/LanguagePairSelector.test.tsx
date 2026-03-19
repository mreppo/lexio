import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguagePairSelector } from './LanguagePairSelector'
import type { LanguagePair } from '@/types'

function makePair(overrides: Partial<LanguagePair> = {}): LanguagePair {
  return {
    id: 'pair-1',
    sourceLang: 'English',
    sourceCode: 'en',
    targetLang: 'Latvian',
    targetCode: 'lv',
    createdAt: 1000000,
    ...overrides,
  }
}

describe('LanguagePairSelector', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should show the active pair label when a pair is active', () => {
    const pair = makePair()
    render(
      <LanguagePairSelector
        pairs={[pair]}
        activePair={pair}
        loading={false}
        onSwitch={vi.fn()}
        onAddPair={vi.fn()}
      />,
    )
    expect(screen.getByText('English → Latvian')).toBeInTheDocument()
  })

  it('should show "Select pair" when no active pair', () => {
    render(
      <LanguagePairSelector
        pairs={[]}
        activePair={null}
        loading={false}
        onSwitch={vi.fn()}
        onAddPair={vi.fn()}
      />,
    )
    expect(screen.getByText('Select pair')).toBeInTheDocument()
  })

  it('should show "Loading..." when loading', () => {
    render(
      <LanguagePairSelector
        pairs={[]}
        activePair={null}
        loading={true}
        onSwitch={vi.fn()}
        onAddPair={vi.fn()}
      />,
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should open a menu when the button is clicked', async () => {
    const user = userEvent.setup()
    const pair = makePair()
    render(
      <LanguagePairSelector
        pairs={[pair]}
        activePair={pair}
        loading={false}
        onSwitch={vi.fn()}
        onAddPair={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('menuitem', { name: /Add pair/i })).toBeInTheDocument()
  })

  it('should call onSwitch when a pair item is clicked', async () => {
    const user = userEvent.setup()
    const pair1 = makePair({ id: 'pair-1', sourceLang: 'English', targetLang: 'Latvian' })
    const pair2 = makePair({
      id: 'pair-2',
      sourceLang: 'German',
      targetLang: 'French',
      sourceCode: 'de',
      targetCode: 'fr',
    })
    const onSwitch = vi.fn()

    render(
      <LanguagePairSelector
        pairs={[pair1, pair2]}
        activePair={pair1}
        loading={false}
        onSwitch={onSwitch}
        onAddPair={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('German → French'))

    expect(onSwitch).toHaveBeenCalledWith('pair-2')
  })

  it('should call onAddPair when "Add pair" is clicked', async () => {
    const user = userEvent.setup()
    const onAddPair = vi.fn()

    render(
      <LanguagePairSelector
        pairs={[]}
        activePair={null}
        loading={false}
        onSwitch={vi.fn()}
        onAddPair={onAddPair}
      />,
    )

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Add pair'))

    expect(onAddPair).toHaveBeenCalledTimes(1)
  })

  it('should show "No language pairs yet" when the list is empty', async () => {
    const user = userEvent.setup()

    render(
      <LanguagePairSelector
        pairs={[]}
        activePair={null}
        loading={false}
        onSwitch={vi.fn()}
        onAddPair={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('No language pairs yet')).toBeInTheDocument()
  })
})
