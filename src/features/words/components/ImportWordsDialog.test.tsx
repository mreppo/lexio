import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportWordsDialog } from './ImportWordsDialog'
import type { ImportSummary, ImportWordsDialogProps } from './ImportWordsDialog'
import { createMockPair, createMockWord } from '@/test/fixtures'

const DEFAULT_PAIR = createMockPair({ sourceLang: 'English', targetLang: 'Latvian' })
const NO_EXISTING_WORDS = [] as const

function renderDialog(
  overrides: {
    open?: boolean
    existingWords?: Parameters<typeof createMockWord>[0][]
    onImport?: ImportWordsDialogProps['onImport']
    onClose?: () => void
  } = {},
) {
  const onImport: ImportWordsDialogProps['onImport'] =
    overrides.onImport ?? vi.fn().mockResolvedValue({ added: 0, skippedDuplicates: 0, errors: 0 })
  const onClose = overrides.onClose ?? vi.fn()
  const existingWords = (overrides.existingWords ?? []).map((o) => createMockWord(o))

  return {
    onImport,
    onClose,
    ...render(
      <ImportWordsDialog
        open={overrides.open ?? true}
        activePair={DEFAULT_PAIR}
        existingWords={existingWords}
        onClose={onClose}
        onImport={onImport}
      />,
    ),
  }
}

describe('ImportWordsDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render the dialog title when open', () => {
      renderDialog()
      expect(screen.getByText('Import words')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      renderDialog({ open: false })
      expect(screen.queryByText('Import words')).not.toBeInTheDocument()
    })

    it('should show language pair in the instruction text', () => {
      renderDialog()
      expect(screen.getByText(/English/)).toBeInTheDocument()
      expect(screen.getByText(/Latvian/)).toBeInTheDocument()
    })

    it('should render the paste textarea', () => {
      renderDialog()
      expect(screen.getByLabelText('Paste words here')).toBeInTheDocument()
    })
  })

  describe('step 1 - input', () => {
    it('should show disabled Preview button when textarea is empty', () => {
      renderDialog()
      const btn = screen.getByRole('button', { name: /Preview/ })
      expect(btn).toBeDisabled()
    })

    it('should enable Preview button when text is entered', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.type(screen.getByLabelText('Paste words here'), 'hello,world')
      expect(screen.getByRole('button', { name: /Preview \(1\)/ })).not.toBeDisabled()
    })

    it('should show detected word count after typing', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.type(screen.getByLabelText('Paste words here'), 'a,b\nc,d\ne,f')
      expect(screen.getByText(/3 words detected/)).toBeInTheDocument()
    })

    it('should show error count for unparseable lines', async () => {
      const user = userEvent.setup()
      renderDialog()

      await user.type(screen.getByLabelText('Paste words here'), 'hello,world\nbadline')
      expect(screen.getByText(/1 line could not be parsed/)).toBeInTheDocument()
    })
  })

  describe('step 2 - preview', () => {
    async function goToPreview(
      text = 'hello,world\ncat,kaķis',
      existingWordOverrides: Parameters<typeof createMockWord>[0][] = [],
    ) {
      const user = userEvent.setup()
      renderDialog({ existingWords: existingWordOverrides })

      await user.type(screen.getByLabelText('Paste words here'), text)
      // Wait for the preview button to become enabled (shows row count > 0)
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /Preview \(\d+\)/ })
        expect(btn).not.toBeDisabled()
      })
      await user.click(screen.getByRole('button', { name: /Preview \(\d+\)/ }))

      return user
    }

    it('should show preview table with parsed rows', async () => {
      await goToPreview('hello,world')
      expect(screen.getByText('hello')).toBeInTheDocument()
      expect(screen.getByText('world')).toBeInTheDocument()
    })

    it('should show Import button with correct count', async () => {
      await goToPreview('hello,world\ncat,kaķis')
      expect(screen.getByRole('button', { name: /Import 2 words/ })).toBeInTheDocument()
    })

    it('should show Back button', async () => {
      await goToPreview()
      expect(screen.getByRole('button', { name: /Back/ })).toBeInTheDocument()
    })

    it('should navigate back to input step when Back is clicked', async () => {
      const user = await goToPreview()
      await user.click(screen.getByRole('button', { name: /Back/ }))
      expect(screen.getByLabelText('Paste words here')).toBeInTheDocument()
    })

    it('should highlight duplicate rows in the preview table', async () => {
      await goToPreview('hello,world\nnew,word', [{ source: 'hello', target: 'world' }])
      expect(screen.getByText('Duplicate')).toBeInTheDocument()
    })

    it('should pre-deselect duplicate rows', async () => {
      await goToPreview('hello,world\nnew,word', [{ source: 'hello', target: 'world' }])
      // 1 of 2 rows selected (the non-duplicate)
      expect(screen.getByRole('button', { name: /Import 1 word/ })).toBeInTheDocument()
    })

    it('should allow user to deselect a row', async () => {
      const user = await goToPreview('hello,world\ncat,kaķis')

      // Deselect the first row via its checkbox
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])

      expect(screen.getByRole('button', { name: /Import 1 word/ })).toBeInTheDocument()
    })

    it('should show parse errors section when there are unparseable lines', async () => {
      await goToPreview('good,line\nbadline')

      await waitFor(() => {
        expect(screen.getByText(/could not be parsed and will be skipped/)).toBeInTheDocument()
      })
    })

    it('should show notes column in preview table', async () => {
      await goToPreview('hello,world,a greeting')
      expect(screen.getByText('a greeting')).toBeInTheDocument()
    })
  })

  describe('step 3 - done', () => {
    async function importWords(
      text = 'hello,world',
      summary: ImportSummary = { added: 1, skippedDuplicates: 0, errors: 0 },
    ) {
      const user = userEvent.setup()
      const onImport = vi.fn().mockResolvedValue(summary)
      const onClose = vi.fn()

      render(
        <ImportWordsDialog
          open={true}
          activePair={DEFAULT_PAIR}
          existingWords={NO_EXISTING_WORDS}
          onClose={onClose}
          onImport={onImport}
        />,
      )

      await user.type(screen.getByLabelText('Paste words here'), text)
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /Preview \(\d+\)/ })
        expect(btn).not.toBeDisabled()
      })
      await user.click(screen.getByRole('button', { name: /Preview \(\d+\)/ }))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Import \d+ word/ })).not.toBeDisabled()
      })
      await user.click(screen.getByRole('button', { name: /Import \d+ word/ }))

      return { user, onImport, onClose }
    }

    it('should show import summary after completion', async () => {
      await importWords('hello,world', { added: 1, skippedDuplicates: 0, errors: 0 })

      await waitFor(() => {
        expect(screen.getByText(/Added/)).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('should show skipped duplicates in summary', async () => {
      await importWords('a,b', { added: 2, skippedDuplicates: 3, errors: 0 })

      await waitFor(() => {
        expect(screen.getByText(/Skipped/)).toBeInTheDocument()
      })
    })

    it('should not show skipped section when there are none', async () => {
      await importWords('a,b', { added: 1, skippedDuplicates: 0, errors: 0 })

      await waitFor(() => {
        expect(screen.queryByText(/Skipped/)).not.toBeInTheDocument()
      })
    })

    it('should show Done button after import', async () => {
      await importWords()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Done/ })).toBeInTheDocument()
      })
    })

    it('should call onImport with selected rows', async () => {
      const { onImport } = await importWords('cat,kaķis\ndog,suns')

      await waitFor(() => {
        expect(onImport).toHaveBeenCalledTimes(1)
        const rows = onImport.mock.calls[0][0]
        expect(rows).toHaveLength(2)
        expect(rows[0]).toMatchObject({ source: 'cat', target: 'kaķis' })
      })
    })

    it('should call onClose when Done is clicked', async () => {
      const { user, onClose } = await importWords()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Done/ })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Done/ }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cancel button', () => {
    it('should call onClose when Cancel is clicked on input step', async () => {
      const user = userEvent.setup()
      const { onClose } = renderDialog()

      await user.click(screen.getByRole('button', { name: /Cancel/ }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
