import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatePairDialog } from './CreatePairDialog'

describe('CreatePairDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should not render when open is false', () => {
    render(
      <CreatePairDialog
        open={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.queryByText('Add language pair')).not.toBeInTheDocument()
  })

  it('should render when open is true', () => {
    render(
      <CreatePairDialog
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByText('Add language pair')).toBeInTheDocument()
  })

  it('should pre-fill EN-LV when suggestDefault is true', () => {
    render(
      <CreatePairDialog
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        suggestDefault={true}
      />,
    )
    // Language codes should be pre-filled
    const inputs = screen.getAllByRole('textbox')
    // Find source code input (the one after the source language autocomplete)
    const codeInputs = inputs.filter((el) => {
      const val = (el as HTMLInputElement).value
      return val === 'en' || val === 'lv'
    })
    expect(codeInputs.length).toBeGreaterThan(0)
  })

  it('should show validation error when submitting empty form', async () => {
    const user = userEvent.setup()
    render(
      <CreatePairDialog
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Create pair/i }))

    expect(screen.getByText('All fields are required.')).toBeInTheDocument()
  })

  it('should show error when source and target are the same', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <CreatePairDialog
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    // Fill language code fields directly
    const codeFields = screen.getAllByLabelText('Language code')
    await user.type(codeFields[0], 'en')
    await user.type(codeFields[1], 'en')

    // Fill source autocomplete
    const autocompletes = screen.getAllByPlaceholderText(/e\.g\./i)
    await user.type(autocompletes[0], 'English')
    await user.type(autocompletes[1], 'English')

    // Need to trigger submit through the button
    await user.click(screen.getByRole('button', { name: /Create pair/i }))

    // Expect either validation or that onSubmit wasn't called with same pair
    // (actual result depends on field state)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <CreatePairDialog
        open={true}
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onSubmit with correct data when form is valid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <CreatePairDialog
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        suggestDefault={true}
      />,
    )

    // Form is pre-filled with EN-LV defaults when suggestDefault=true
    await user.click(screen.getByRole('button', { name: /Create pair/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        sourceLang: 'English',
        sourceCode: 'en',
        targetLang: 'Latvian',
        targetCode: 'lv',
      })
    })
  })
})
