import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguagePairList } from './LanguagePairList'
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

describe('LanguagePairList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should show empty state message when no pairs', () => {
    render(<LanguagePairList pairs={[]} activePairId={null} onDelete={vi.fn()} />)
    expect(screen.getByText(/No language pairs yet/i)).toBeInTheDocument()
  })

  it('should render a list item for each pair', () => {
    const pairs = [
      makePair({ id: 'pair-1', sourceLang: 'English', targetLang: 'Latvian' }),
      makePair({
        id: 'pair-2',
        sourceLang: 'German',
        targetLang: 'French',
        sourceCode: 'de',
        targetCode: 'fr',
      }),
    ]

    render(<LanguagePairList pairs={pairs} activePairId={null} onDelete={vi.fn()} />)

    expect(screen.getByText('English → Latvian')).toBeInTheDocument()
    expect(screen.getByText('German → French')).toBeInTheDocument()
  })

  it('should show the Active chip on the active pair', () => {
    const pairs = [
      makePair({ id: 'pair-1', sourceLang: 'English', targetLang: 'Latvian' }),
      makePair({
        id: 'pair-2',
        sourceLang: 'German',
        targetLang: 'French',
        sourceCode: 'de',
        targetCode: 'fr',
      }),
    ]

    render(<LanguagePairList pairs={pairs} activePairId="pair-1" onDelete={vi.fn()} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should open the delete confirmation dialog when the delete button is clicked', async () => {
    const user = userEvent.setup()
    const pair = makePair()

    render(<LanguagePairList pairs={[pair]} activePairId={null} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Delete English to Latvian pair/i }))
    // Dialog should appear
    expect(screen.getByText('Delete language pair?')).toBeInTheDocument()
  })

  it('should display language codes as secondary text', () => {
    const pair = makePair()
    render(<LanguagePairList pairs={[pair]} activePairId={null} onDelete={vi.fn()} />)
    expect(screen.getByText('en → lv')).toBeInTheDocument()
  })
})
