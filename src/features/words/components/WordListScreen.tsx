import { useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import type { Word, LanguagePair } from '@/types'
import { useWords } from '../useWords'
import type { CreateWordInput } from '../useWords'
import { WordList } from './WordList'
import { WordFormDialog } from './WordFormDialog'

export interface WordListScreenProps {
  readonly activePair: LanguagePair | null
}

/**
 * Top-level screen for browsing and managing vocabulary for the active language pair.
 * Handles empty states, loading, and delegates list + form to sub-components.
 */
export function WordListScreen({ activePair }: WordListScreenProps) {
  const { words, progressMap, loading, addWord, updateWord, deleteWord, deleteWords } =
    useWords(activePair?.id ?? null)

  const [formOpen, setFormOpen] = useState(false)
  const [wordToEdit, setWordToEdit] = useState<Word | null>(null)
  const [quickAddMode, setQuickAddMode] = useState(false)

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

  // Empty state
  if (words.length === 0) {
    return (
      <>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom fontWeight={700}>
            No words yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 340, mx: 'auto' }}>
            Add your first word to start building your vocabulary for{' '}
            <strong>
              {activePair.sourceLang} → {activePair.targetLang}
            </strong>
            . You can also import a starter pack from the settings.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAdd(false)}>
              Add your first word
            </Button>
            <Button variant="outlined" onClick={() => handleOpenAdd(true)}>
              Quick add
            </Button>
          </Stack>
        </Box>

        <WordFormDialog
          open={formOpen}
          word={wordToEdit}
          quickAddMode={quickAddMode}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
        />
      </>
    )
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          {activePair.sourceLang} → {activePair.targetLang}
        </Typography>
        <Stack direction="row" spacing={1}>
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

      <WordFormDialog
        open={formOpen}
        word={wordToEdit}
        quickAddMode={quickAddMode}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />
    </>
  )
}
