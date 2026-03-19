import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Chip,
  Box,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import type { Word } from '@/types'
import type { CreateWordInput } from '../useWords'

export interface WordFormDialogProps {
  readonly open: boolean
  /** If provided, the dialog is in edit mode. If null, add mode. */
  readonly word: Word | null
  /** If true, after saving the form resets for quick-add of another word. */
  readonly quickAddMode?: boolean
  readonly onClose: () => void
  readonly onSubmit: (input: CreateWordInput) => Promise<boolean>
}

const EMPTY_FORM = {
  source: '',
  target: '',
  notes: '',
  tagInput: '',
  tags: [] as string[],
}

/**
 * Dialog for adding a new word or editing an existing one.
 * Quick-add mode resets the form after each save to allow rapid entry.
 */
export function WordFormDialog({
  open,
  word,
  quickAddMode = false,
  onClose,
  onSubmit,
}: WordFormDialogProps) {
  const isEdit = word !== null

  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [notes, setNotes] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [duplicateError, setDuplicateError] = useState(false)

  // Populate form when editing an existing word or when dialog opens.
  useEffect(() => {
    if (open) {
      if (word) {
        setSource(word.source)
        setTarget(word.target)
        setNotes(word.notes ?? '')
        setTags([...word.tags])
      } else {
        setSource(EMPTY_FORM.source)
        setTarget(EMPTY_FORM.target)
        setNotes(EMPTY_FORM.notes)
        setTagInput(EMPTY_FORM.tagInput)
        setTags(EMPTY_FORM.tags)
      }
      setDuplicateError(false)
    }
  }, [open, word])

  const resetForm = useCallback(() => {
    setSource('')
    setTarget('')
    setNotes('')
    setTagInput('')
    setTags([])
    setDuplicateError(false)
  }, [])

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput('')
  }, [tagInput, tags])

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        addTag()
      }
    },
    [addTag],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!source.trim() || !target.trim()) return

      setSubmitting(true)
      setDuplicateError(false)

      const success = await onSubmit({
        source: source.trim(),
        target: target.trim(),
        notes: notes.trim() || null,
        tags,
      })

      setSubmitting(false)

      if (!success) {
        setDuplicateError(true)
        return
      }

      if (quickAddMode && !isEdit) {
        resetForm()
      } else {
        onClose()
      }
    },
    [source, target, notes, tags, onSubmit, quickAddMode, isEdit, onClose, resetForm],
  )

  const canSubmit = source.trim().length > 0 && target.trim().length > 0 && !submitting

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle>{isEdit ? 'Edit word' : 'Add word'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Source word"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            autoFocus
            required
            fullWidth
            inputProps={{ lang: 'mul' }}
            error={duplicateError}
          />

          <TextField
            label="Target word"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
            fullWidth
            inputProps={{ lang: 'mul' }}
            error={duplicateError}
            helperText={duplicateError ? 'This word already exists in the list.' : undefined}
          />

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Example sentence, context, memory hint…"
          />

          <Box>
            <TextField
              label="Tags (optional)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              fullWidth
              placeholder="Press Enter or comma to add a tag"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Add tag"
                      onClick={addTag}
                      edge="end"
                      size="small"
                      disabled={!tagInput.trim()}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onDelete={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  />
                ))}
              </Box>
            )}
          </Box>

          {quickAddMode && !isEdit && (
            <Typography variant="caption" color="text.secondary">
              Quick-add mode: form resets after each save so you can add multiple words.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSubmit}>
          {isEdit ? 'Save' : 'Add word'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
