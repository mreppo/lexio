import { useState, useCallback } from 'react'
import { Box, Typography, Button, CircularProgress, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import type { Word, LanguagePair } from '@/types'
import { useWords } from '../useWords'
import type { CreateWordInput } from '../useWords'
import type { ParsedWordRow } from '@/utils/importParser'
import { WordList } from './WordList'
import { WordFormDialog } from './WordFormDialog'
import { ImportWordsDialog } from './ImportWordsDialog'
import type { ImportSummary } from './ImportWordsDialog'
import { PackBrowserDialog } from '@/features/starter-packs'

export interface WordListScreenProps {
  readonly activePair: LanguagePair | null
}

/**
 * Top-level screen for browsing and managing vocabulary for the active language pair.
 * Handles empty states, loading, and delegates list + form to sub-components.
 */
export function WordListScreen({ activePair }: WordListScreenProps) {
  const { words, progressMap, loading, addWord, updateWord, deleteWord, deleteWords, refresh } =
    useWords(activePair?.id ?? null)

  const [formOpen, setFormOpen] = useState(false)
  const [wordToEdit, setWordToEdit] = useState<Word | null>(null)
  const [quickAddMode, setQuickAddMode] = useState(false)
  const [packBrowserOpen, setPackBrowserOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const handleOpenAdd = useCallback((quick = false) => {
    setWordToEdit(null)
    setQuickAddMode(quick)
    setFormOpen(true)
  }, [])

  const handleOpenEdit = useCallback((word: Word) => {
    setWordToEdit(word)
    setQuickAddMode(false)
    setFormOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setFormOpen(false)
    setWordToEdit(null)
  }, [])

  const handleSubmit = useCallback(
    async (input: CreateWordInput): Promise<boolean> => {
      if (!activePair) return false

      if (wordToEdit) {
        await updateWord(wordToEdit.id, input)
        return true
      }

      const result = await addWord(activePair.id, input)
      return result !== null
    },
    [activePair, wordToEdit, addWord, updateWord],
  )

  const handleOpenImport = useCallback(() => {
    setImportOpen(true)
  }, [])

  const handleCloseImport = useCallback(() => {
    setImportOpen(false)
  }, [])

  const handleImport = useCallback(
    async (rows: readonly ParsedWordRow[]): Promise<ImportSummary> => {
      if (!activePair) return { added: 0, skippedDuplicates: 0, errors: 0 }

      let added = 0
      let skippedDuplicates = 0

      for (const row of rows) {
        const result = await addWord(activePair.id, {
          source: row.source,
          target: row.target,
          notes: row.notes,
          tags: ['imported'],
        })
        if (result === null) {
          skippedDuplicates++
        } else {
          added++
        }
      }

      return { added, skippedDuplicates, errors: 0 }
    },
    [activePair, addWord],
  )

  const handleOpenPackBrowser = useCallback(() => {
    setPackBrowserOpen(true)
  }, [])

  const handleClosePackBrowser = useCallback(() => {
    setPackBrowserOpen(false)
  }, [])

  const handlePackInstalled = useCallback(() => {
    // Refresh the word list after a pack is installed.
    refresh()
  }, [refresh])

  // No active pair selected
  if (!activePair) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No language pair selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a language pair from the toolbar to manage words.
        </Typography>
      </Box>
    )
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      {words.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom fontWeight={700}>
            No words yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 340, mx: 'auto' }}
          >
            Add your first word to start building your vocabulary for{' '}
            <strong>
              {activePair.sourceLang} → {activePair.targetLang}
            </strong>
            , or install a starter pack to get going quickly.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAdd(false)}
            >
              Add your first word
            </Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleOpenImport}>
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<LibraryBooksIcon />}
              onClick={handleOpenPackBrowser}
            >
              Starter packs
            </Button>
          </Stack>
        </Box>
      ) : (
        <>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              {activePair.sourceLang} → {activePair.targetLang}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LibraryBooksIcon />}
                onClick={handleOpenPackBrowser}
              >
                Packs
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadFileIcon />}
                onClick={handleOpenImport}
              >
                Import
              </Button>
              <Button variant="outlined" size="small" onClick={() => handleOpenAdd(true)}>
                Quick add
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleOpenAdd(false)}
              >
                Add word
              </Button>
            </Stack>
          </Box>

          <WordList
            words={words}
            progressMap={progressMap}
            onEdit={handleOpenEdit}
            onDelete={deleteWord}
            onBulkDelete={deleteWords}
          />
        </>
      )}

      {/* Dialogs rendered once, outside conditionals, so their lifecycle is not
          tied to which branch is active. This prevents the dialog from reopening
          when a pack install transitions words.length from 0 to >0. */}
      <WordFormDialog
        open={formOpen}
        word={wordToEdit}
        quickAddMode={quickAddMode}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />

      <PackBrowserDialog
        open={packBrowserOpen}
        pairId={activePair.id}
        pairSourceCode={activePair.sourceCode}
        pairTargetCode={activePair.targetCode}
        onClose={handleClosePackBrowser}
        onInstalled={handlePackInstalled}
      />

      <ImportWordsDialog
        open={importOpen}
        activePair={activePair}
        existingWords={words}
        onClose={handleCloseImport}
        onImport={handleImport}
      />
    </>
  )
}
