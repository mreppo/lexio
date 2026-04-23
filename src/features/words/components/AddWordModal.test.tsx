/**
 * AddWordModal tests — issue #150.
 *
 * Covers AC minimum:
 *   - Modal renders Cancel / "New Word" / Save.
 *   - Save disabled when Term empty; when Meaning empty; enabled when both ≥1 char (trimmed).
 *   - Cancel closes modal.
 *   - Part-of-speech chips: can select one; selecting another deselects previous (single-select).
 *   - AI "Coming soon" button is inert (disabled attribute, no click handler invocation).
 *   - Successful save: addWord spy called with expected payload; onClose called; toast visible.
 *   - Diacritic input: typing 'ķ' into Term field persists correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddWordModal } from './AddWordModal'
import { PART_OF_SPEECH_OPTIONS } from '../partOfSpeech'
import { createMockStorage } from '@/test/mockStorage'
import { renderWithStorage } from '@/test/renderWithStorage'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAIR_ID = 'pair-1'
const FROM_CODE = 'es'
const TO_CODE = 'en'

function makeStorage(saveWord = vi.fn().mockResolvedValue(undefined)) {
  return createMockStorage({
    getWords: vi.fn().mockResolvedValue([]),
    getAllProgress: vi.fn().mockResolvedValue([]),
    saveWord,
  })
}

interface RenderOptions {
  readonly open?: boolean
  readonly onClose?: () => void
  readonly saveWord?: ReturnType<typeof vi.fn>
}

function renderModal({ open = true, onClose = vi.fn(), saveWord }: RenderOptions = {}) {
  const storage = makeStorage(saveWord)
  renderWithStorage(
    <AddWordModal
      open={open}
      onClose={onClose}
      pairId={PAIR_ID}
      fromCode={FROM_CODE}
      toCode={TO_CODE}
    />,
    storage,
  )
  return { onClose, storage }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AddWordModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // ─── Nav row ───────────────────────────────────────────────────────────────

  describe('Nav row', () => {
    it('should render Cancel, "New Word" title, and Save', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /new word/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('should not render when open is false', () => {
      renderModal({ open: false })
      expect(screen.queryByRole('heading', { name: /new word/i })).not.toBeInTheDocument()
    })
  })

  // ─── Save button disabled state ────────────────────────────────────────────

  describe('Save button validation', () => {
    it('should be disabled when both Term and Meaning are empty', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    })

    it('should be disabled when only Term is filled', async () => {
      const user = userEvent.setup()
      renderModal()

      const termInput = screen.getByRole('textbox', { name: /term in es/i })
      await user.type(termInput, 'hello')

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    })

    it('should be disabled when only Meaning is filled', async () => {
      const user = userEvent.setup()
      renderModal()

      const meaningInput = screen.getByRole('textbox', { name: /meaning in en/i })
      await user.type(meaningInput, 'hola')

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    })

    it('should be enabled when both Term and Meaning have at least 1 character', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByRole('textbox', { name: /term in es/i }), 'hello')
      await user.type(screen.getByRole('textbox', { name: /meaning in en/i }), 'hola')

      expect(screen.getByRole('button', { name: /save/i })).toBeEnabled()
    })

    it('should remain disabled when Term is only whitespace', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByRole('textbox', { name: /term in es/i }), '   ')
      await user.type(screen.getByRole('textbox', { name: /meaning in en/i }), 'hola')

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    })

    it('should remain disabled when Meaning is only whitespace', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByRole('textbox', { name: /term in es/i }), 'hello')
      await user.type(screen.getByRole('textbox', { name: /meaning in en/i }), '   ')

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    })
  })

  // ─── Cancel behaviour ──────────────────────────────────────────────────────

  describe('Cancel behaviour', () => {
    it('should call onClose when Cancel is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      renderModal({ onClose })

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Part-of-speech chip row ───────────────────────────────────────────────

  describe('Part-of-speech chip row', () => {
    it('should render all five part-of-speech chips', () => {
      renderModal()
      for (const pos of PART_OF_SPEECH_OPTIONS) {
        // Chips are rendered as radios
        expect(screen.getByRole('radio', { name: pos })).toBeInTheDocument()
      }
    })

    it('should start with no chip selected', () => {
      renderModal()
      for (const pos of PART_OF_SPEECH_OPTIONS) {
        expect(screen.getByRole('radio', { name: pos })).toHaveAttribute('aria-checked', 'false')
      }
    })

    it('should select a chip when clicked', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('radio', { name: 'noun' }))

      expect(screen.getByRole('radio', { name: 'noun' })).toHaveAttribute('aria-checked', 'true')
    })

    it('should deselect the previous chip when a new one is selected', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('radio', { name: 'noun' }))
      await user.click(screen.getByRole('radio', { name: 'verb' }))

      expect(screen.getByRole('radio', { name: 'verb' })).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByRole('radio', { name: 'noun' })).toHaveAttribute('aria-checked', 'false')
    })

    it('should deselect a chip when clicked again (toggle off)', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('radio', { name: 'noun' }))
      await user.click(screen.getByRole('radio', { name: 'noun' }))

      expect(screen.getByRole('radio', { name: 'noun' })).toHaveAttribute('aria-checked', 'false')
    })

    it('should only allow one chip selected at a time', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('radio', { name: 'noun' }))
      await user.click(screen.getByRole('radio', { name: 'adj' }))

      const checkedRadios = PART_OF_SPEECH_OPTIONS.filter(
        (pos) => screen.getByRole('radio', { name: pos }).getAttribute('aria-checked') === 'true',
      )
      expect(checkedRadios).toHaveLength(1)
      expect(checkedRadios[0]).toBe('adj')
    })
  })

  // ─── AI upsell button ──────────────────────────────────────────────────────

  describe('AI upsell "Coming soon" button', () => {
    it('should render the Coming soon button', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /coming soon/i })).toBeInTheDocument()
    })

    it('should be disabled', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /coming soon/i })).toBeDisabled()
    })

    it('should have aria-disabled set to true', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /coming soon/i })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    })

    it('should not fire any handler when clicked (inert via pointer-events: none)', async () => {
      const onClose = vi.fn()
      renderModal({ onClose })

      const button = screen.getByRole('button', { name: /coming soon/i })

      // The button has pointer-events: none so userEvent.click would throw.
      // Use fireEvent.click which bypasses the pointer-events check — this
      // tests that no side-effect occurs even if the click somehow reaches it.
      fireEvent.click(button)

      // onClose should NOT be called — the button is purely decorative/inert
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  // ─── Successful save path ──────────────────────────────────────────────────

  describe('Successful save path', () => {
    it('should call onClose after a successful save', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const saveWord = vi.fn().mockResolvedValue(undefined)
      renderModal({ onClose, saveWord })

      await user.type(screen.getByRole('textbox', { name: /term in es/i }), 'madrugar')
      await user.type(screen.getByRole('textbox', { name: /meaning in en/i }), 'to wake up early')

      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should call saveWord with the correct source and target', async () => {
      const user = userEvent.setup()
      const saveWord = vi.fn().mockResolvedValue(undefined)
      renderModal({ saveWord })

      await user.type(screen.getByRole('textbox', { name: /term in es/i }), 'madrugar')
      await user.type(screen.getByRole('textbox', { name: /meaning in en/i }), 'to wake up early')

      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(saveWord).toHaveBeenCalledTimes(1)
        const savedWord = saveWord.mock.calls[0][0] as {
          source: string
          target: string
          pairId: string
        }
        expect(savedWord.source).toBe('madrugar')
        expect(savedWord.target).toBe('to wake up early')
        expect(savedWord.pairId).toBe(PAIR_ID)
      })
    })

    it('should show toast confirmation after successful save', async () => {
      const user = userEvent.setup()
      const saveWord = vi.fn().mockResolvedValue(undefined)
      renderModal({ saveWord })

      await user.type(screen.getByRole('textbox', { name: /term in es/i }), 'hello')
      await user.type(screen.getByRole('textbox', { name: /meaning in en/i }), 'hola')

      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(screen.getByText(/word saved/i)).toBeInTheDocument()
      })
    })
  })

  // ─── Diacritic input ───────────────────────────────────────────────────────

  describe('Diacritic input', () => {
    it('should persist Latvian diacritic character ķ in Term field', async () => {
      const user = userEvent.setup()
      renderModal()

      const termInput = screen.getByRole('textbox', { name: /term in es/i })
      // Type a word containing a Latvian diacritic
      await user.type(termInput, 'ķīmija')

      expect(termInput).toHaveValue('ķīmija')
    })

    it('should persist Latvian diacritic characters in Meaning field', async () => {
      const user = userEvent.setup()
      renderModal()

      const meaningInput = screen.getByRole('textbox', { name: /meaning in en/i })
      await user.type(meaningInput, 'ābols')

      expect(meaningInput).toHaveValue('ābols')
    })
  })

  // ─── Field labels reflect language codes ──────────────────────────────────

  describe('Field labels', () => {
    it('should show fromCode in Term label', () => {
      renderModal()
      // Label text: "TERM · ES" (uppercased)
      expect(screen.getByText(/TERM · ES/)).toBeInTheDocument()
    })

    it('should show toCode in Meaning label', () => {
      renderModal()
      // Label text: "MEANING · EN" (uppercased)
      expect(screen.getByText(/MEANING · EN/)).toBeInTheDocument()
    })
  })
})
