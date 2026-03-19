import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WordList } from './WordList'
import type { Word, WordProgress } from '@/types'
import { createMockWord, createMockProgress } from '@/test/fixtures'

function makeWord(overrides: Partial<Word> = {}): Word {
  return createMockWord({
    id: `word-${Math.random()}`,
    createdAt: Date.now(),
    ...overrides,
  })
}

function makeProgress(wordId: string, confidence: number): WordProgress {
  return createMockProgress({
    wordId,
    correctCount: 5,
    incorrectCount: 1,
    streak: 3,
    lastReviewed: Date.now(),
    nextReview: Date.now() + 86400000,
    confidence,
  })
}

const defaultProps = {
  words: [] as Word[],
  progressMap: new Map<string, WordProgress>(),
  onEdit: vi.fn() as (word: Word) => void,
  onDelete: vi.fn().mockResolvedValue(undefined) as (wordId: string) => Promise<void>,
  onBulkDelete: vi.fn().mockResolvedValue(undefined) as (
    wordIds: readonly string[],
  ) => Promise<void>,
}

describe('WordList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should show empty message when no words match filters', () => {
    render(<WordList {...defaultProps} words={[]} />)
    expect(screen.getByText(/No words match/i)).toBeInTheDocument()
  })

  it('should render word items', () => {
    const words = [
      makeWord({ id: 'w1', source: 'cat', target: 'kaķis' }),
      makeWord({ id: 'w2', source: 'dog', target: 'suns' }),
    ]
    render(<WordList {...defaultProps} words={words} />)
    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText('kaķis')).toBeInTheDocument()
    expect(screen.getByText('dog')).toBeInTheDocument()
    expect(screen.getByText('suns')).toBeInTheDocument()
  })

  it('should show word count', () => {
    const words = [makeWord({ id: 'w1' }), makeWord({ id: 'w2' })]
    render(<WordList {...defaultProps} words={words} />)
    expect(screen.getByText(/2 words/i)).toBeInTheDocument()
  })

  it('should filter words by search query', async () => {
    const user = userEvent.setup()
    const words = [
      makeWord({ id: 'w1', source: 'cat', target: 'kaķis' }),
      makeWord({ id: 'w2', source: 'dog', target: 'suns' }),
    ]
    render(<WordList {...defaultProps} words={words} />)

    await user.type(screen.getByLabelText(/Search words/i), 'cat')

    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.queryByText('dog')).not.toBeInTheDocument()
  })

  it('should filter words by target word in search', async () => {
    const user = userEvent.setup()
    const words = [
      makeWord({ id: 'w1', source: 'cat', target: 'kaķis' }),
      makeWord({ id: 'w2', source: 'dog', target: 'suns' }),
    ]
    render(<WordList {...defaultProps} words={words} />)

    await user.type(screen.getByLabelText(/Search words/i), 'kaķ')

    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.queryByText('dog')).not.toBeInTheDocument()
  })

  it('should show tag filter chips when words have tags', () => {
    const words = [makeWord({ id: 'w1', tags: ['food', 'B1'] })]
    render(<WordList {...defaultProps} words={words} />)
    expect(screen.getByRole('button', { name: /food/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /B1/i })).toBeInTheDocument()
  })

  it('should filter by tag when a tag chip is clicked', async () => {
    const user = userEvent.setup()
    const words = [
      makeWord({ id: 'w1', source: 'apple', target: 'ābols', tags: ['food'] }),
      makeWord({ id: 'w2', source: 'run', target: 'skriet', tags: ['verbs'] }),
    ]
    render(<WordList {...defaultProps} words={words} />)

    // Click the 'food' tag chip
    const foodChip = screen.getByRole('button', { name: /food/i })
    await user.click(foodChip)

    expect(screen.getByText('apple')).toBeInTheDocument()
    expect(screen.queryByText('run')).not.toBeInTheDocument()
  })

  it('should enter selection mode when Select button is clicked', async () => {
    const user = userEvent.setup()
    const words = [makeWord({ id: 'w1', source: 'cat', target: 'kaķis' })]
    render(<WordList {...defaultProps} words={words} />)

    await user.click(screen.getByRole('button', { name: /Select/i }))

    expect(screen.getByLabelText(/Select cat/i)).toBeInTheDocument()
  })

  it('should exit selection mode when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const words = [makeWord({ id: 'w1', source: 'cat', target: 'kaķis' })]
    render(<WordList {...defaultProps} words={words} />)

    await user.click(screen.getByRole('button', { name: /Select/i }))
    await user.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(screen.queryByLabelText(/Select cat/i)).not.toBeInTheDocument()
  })

  it('should show Delete button when items are selected', async () => {
    const user = userEvent.setup()
    const words = [makeWord({ id: 'w1', source: 'cat', target: 'kaķis' })]
    render(<WordList {...defaultProps} words={words} />)

    await user.click(screen.getByRole('button', { name: /Select/i }))

    // Click the checkbox input directly
    const checkbox = screen.getByLabelText(/Select cat/i)
    await user.click(checkbox)

    // The Delete button text is "Delete (1)" - check by text content
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find(
      (b) => b.textContent?.includes('Delete') && b.textContent?.includes('1'),
    )
    expect(deleteBtn).toBeTruthy()
  })

  it('should open delete confirmation when single delete is triggered', async () => {
    const user = userEvent.setup()
    const words = [makeWord({ id: 'w1', source: 'cat', target: 'kaķis' })]
    render(<WordList {...defaultProps} words={words} />)

    await user.click(screen.getByLabelText(/Delete cat/i))

    expect(screen.getByText(/Delete word\?/i)).toBeInTheDocument()
  })

  it('should call onDelete when delete is confirmed', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(undefined)
    const words = [makeWord({ id: 'w1', source: 'cat', target: 'kaķis' })]
    render(<WordList {...defaultProps} words={words} onDelete={onDelete} />)

    await user.click(screen.getByLabelText(/Delete cat/i))
    await user.click(screen.getByRole('button', { name: /^Delete$/i }))

    expect(onDelete).toHaveBeenCalledWith('w1')
  })

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const word = makeWord({ id: 'w1', source: 'cat', target: 'kaķis' })
    render(<WordList {...defaultProps} words={[word]} onEdit={onEdit} />)

    await user.click(screen.getByLabelText(/Edit cat/i))

    expect(onEdit).toHaveBeenCalledWith(word)
  })

  it('should show confidence chip when progress exists', () => {
    const word = makeWord({ id: 'w1', source: 'cat', target: 'kaķis' })
    const progress = makeProgress('w1', 0.8)
    const progressMap = new Map([['w1', progress]])

    render(<WordList {...defaultProps} words={[word]} progressMap={progressMap} />)

    expect(screen.getByLabelText(/Confidence: Mastered/i)).toBeInTheDocument()
  })

  it('should show select-all checkbox in selection mode', async () => {
    const user = userEvent.setup()
    const words = [makeWord({ id: 'w1', source: 'cat' }), makeWord({ id: 'w2', source: 'dog' })]
    render(<WordList {...defaultProps} words={words} />)

    await user.click(screen.getByRole('button', { name: /Select/i }))

    expect(screen.getByLabelText(/Select all visible words/i)).toBeInTheDocument()
  })

  it('should select all words when select-all is checked', async () => {
    const user = userEvent.setup()
    const words = [makeWord({ id: 'w1', source: 'cat' }), makeWord({ id: 'w2', source: 'dog' })]
    render(<WordList {...defaultProps} words={words} />)

    await user.click(screen.getByRole('button', { name: /Select/i }))
    await user.click(screen.getByLabelText(/Select all visible words/i))

    // Delete button should show count of 2
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find(
      (b) => b.textContent?.includes('Delete') && b.textContent?.includes('2'),
    )
    expect(deleteBtn).toBeTruthy()
  })

  it('should show pack badge for starter pack words', () => {
    const word = makeWord({ id: 'w1', source: 'cat', isFromPack: true })
    render(<WordList {...defaultProps} words={[word]} />)
    expect(screen.getByLabelText(/From starter pack/i)).toBeInTheDocument()
  })

  it('should filter by word source (user-added vs pack)', async () => {
    const user = userEvent.setup()
    const words = [
      makeWord({ id: 'w1', source: 'cat', isFromPack: false }),
      makeWord({ id: 'w2', source: 'dog', isFromPack: true }),
    ]
    render(<WordList {...defaultProps} words={words} />)

    // Change word filter to 'user-added'
    await user.click(screen.getByLabelText('Filter'))
    await user.click(screen.getByText('My words'))

    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.queryByText('dog')).not.toBeInTheDocument()
  })

  it('should not show Select button when there are no words', () => {
    render(<WordList {...defaultProps} words={[]} />)
    expect(screen.queryByRole('button', { name: /Select/i })).not.toBeInTheDocument()
  })

  it('should show notes in word list item when notes exist', () => {
    const word = makeWord({ id: 'w1', source: 'house', notes: 'a building to live in' })
    render(<WordList {...defaultProps} words={[word]} />)
    expect(screen.getByText('a building to live in')).toBeInTheDocument()
  })
})
