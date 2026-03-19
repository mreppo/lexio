import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WordFormDialog } from './WordFormDialog'
import type { Word } from '@/types'

function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'word-1',
    pairId: 'pair-1',
    source: 'house',
    target: 'māja',
    notes: 'a place to live',
    tags: ['nouns', 'B1'],
    createdAt: 1_000_000,
    isFromPack: false,
    ...overrides,
  }
}

describe('WordFormDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should not render when open is false', () => {
    render(<WordFormDialog open={false} word={null} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.queryByText('Add word')).not.toBeInTheDocument()
  })

  it('should render add mode when open is true and word is null', () => {
    render(<WordFormDialog open={true} word={null} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Add word' })).toBeInTheDocument()
  })

  it('should render edit mode when a word is provided', () => {
    render(<WordFormDialog open={true} word={makeWord()} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Edit word')).toBeInTheDocument()
  })

  it('should pre-fill form fields when editing an existing word', () => {
    render(<WordFormDialog open={true} word={makeWord()} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByDisplayValue('house')).toBeInTheDocument()
    expect(screen.getByDisplayValue('māja')).toBeInTheDocument()
    expect(screen.getByDisplayValue('a place to live')).toBeInTheDocument()
  })

  it('should show existing tags in edit mode', () => {
    render(<WordFormDialog open={true} word={makeWord()} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('nouns')).toBeInTheDocument()
    expect(screen.getByText('B1')).toBeInTheDocument()
  })

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<WordFormDialog open={true} word={null} onClose={onClose} onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should disable submit button when fields are empty', () => {
    render(<WordFormDialog open={true} word={null} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Add word/i })).toBeDisabled()
  })

  it('should enable submit button when source and target are filled', async () => {
    const user = userEvent.setup()
    render(<WordFormDialog open={true} word={null} onClose={vi.fn()} onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/Source word/i), 'cat')
    await user.type(screen.getByLabelText(/Target word/i), 'kaķis')
    expect(screen.getByRole('button', { name: /Add word/i })).toBeEnabled()
  })

  it('should call onSubmit with correct data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(true)

    render(<WordFormDialog open={true} word={null} onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/Source word/i), 'cat')
    await user.type(screen.getByLabelText(/Target word/i), 'kaķis')
    await user.click(screen.getByRole('button', { name: /Add word/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        source: 'cat',
        target: 'kaķis',
        notes: null,
        tags: [],
      })
    })
  })

  it('should show duplicate error when onSubmit returns false', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(false)

    render(<WordFormDialog open={true} word={null} onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/Source word/i), 'cat')
    await user.type(screen.getByLabelText(/Target word/i), 'kaķis')
    await user.click(screen.getByRole('button', { name: /Add word/i }))

    await waitFor(() => {
      expect(screen.getByText('This word already exists in the list.')).toBeInTheDocument()
    })
  })

  it('should add a tag when pressing Enter in the tag field', async () => {
    const user = userEvent.setup()
    render(<WordFormDialog open={true} word={null} onClose={vi.fn()} onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/Tags/i), 'food')
    await user.keyboard('{Enter}')

    expect(screen.getByText('food')).toBeInTheDocument()
  })

  it('should remove a tag when its delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<WordFormDialog open={true} word={makeWord()} onClose={vi.fn()} onSubmit={vi.fn()} />)

    // Word has 'nouns' and 'B1' tags.
    // MUI Chip places aria-label on the chip root div (role="button") when onDelete is set.
    // The actual delete SVG (CancelIcon) is inside. We need to click the CancelIcon directly.
    const nounChip = screen.getByLabelText('Remove tag nouns')
    // Find the CancelIcon SVG inside this chip
    const cancelIcon = nounChip.querySelector('[data-testid="CancelIcon"]')
    expect(cancelIcon).not.toBeNull()
    await user.click(cancelIcon!)

    await waitFor(() => {
      expect(screen.queryByLabelText('Remove tag nouns')).not.toBeInTheDocument()
    })
    expect(screen.getByLabelText('Remove tag B1')).toBeInTheDocument()
  })

  it('should close the dialog after successful submit in non-quick-add mode', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(true)

    render(
      <WordFormDialog
        open={true}
        word={null}
        quickAddMode={false}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText(/Source word/i), 'cat')
    await user.type(screen.getByLabelText(/Target word/i), 'kaķis')
    await user.click(screen.getByRole('button', { name: /Add word/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('should reset the form in quick-add mode instead of closing', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(true)

    render(
      <WordFormDialog
        open={true}
        word={null}
        quickAddMode={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText(/Source word/i), 'cat')
    await user.type(screen.getByLabelText(/Target word/i), 'kaķis')
    await user.click(screen.getByRole('button', { name: /Add word/i }))

    await waitFor(() => {
      // Form should be reset, not closed
      expect(onClose).not.toHaveBeenCalled()
      expect(screen.getByLabelText(/Source word/i)).toHaveValue('')
    })
  })
})
