import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeletePairDialog } from './DeletePairDialog'
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

describe('DeletePairDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should not render when open is false', () => {
    render(
      <DeletePairDialog
        open={false}
        pair={makePair()}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.queryByText('Delete language pair?')).not.toBeInTheDocument()
  })

  it('should render the pair name in the confirmation message', () => {
    const pair = makePair()
    render(
      <DeletePairDialog
        open={true}
        pair={pair}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText(/English → Latvian/)).toBeInTheDocument()
  })

  it('should warn that the action cannot be undone', () => {
    render(
      <DeletePairDialog
        open={true}
        pair={makePair()}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
  })

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <DeletePairDialog
        open={true}
        pair={makePair()}
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm with the pair id when Delete is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const pair = makePair()

    render(
      <DeletePairDialog
        open={true}
        pair={pair}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Delete pair/i }))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('pair-1')
    })
  })

  it('should show an error message when onConfirm throws', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockRejectedValue(new Error('Storage error'))

    render(
      <DeletePairDialog
        open={true}
        pair={makePair()}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Delete pair/i }))

    await waitFor(() => {
      expect(screen.getByText(/Failed to delete/i)).toBeInTheDocument()
    })
  })
})
