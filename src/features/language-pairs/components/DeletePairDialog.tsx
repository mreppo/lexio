import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material'
import type { LanguagePair } from '@/types'

export interface DeletePairDialogProps {
  readonly open: boolean
  readonly pair: LanguagePair | null
  readonly onClose: () => void
  readonly onConfirm: (pairId: string) => Promise<void>
}

/**
 * Confirmation dialog for deleting a language pair.
 * Warns the user that all words and progress will be permanently removed.
 */
export function DeletePairDialog({ open, pair, onClose, onConfirm }: DeletePairDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setError(null)
    setDeleting(false)
    onClose()
  }, [onClose])

  const handleConfirm = useCallback(async () => {
    if (!pair) return

    setError(null)
    setDeleting(true)

    try {
      await onConfirm(pair.id)
      handleClose()
    } catch {
      setError('Failed to delete. Please try again.')
      setDeleting(false)
    }
  }, [pair, onConfirm, handleClose])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Typography variant="h6" component="span" fontWeight={700}>
          Delete language pair?
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" gutterBottom>
          This will permanently delete{' '}
          <strong>{pair ? `${pair.sourceLang} → ${pair.targetLang}` : 'this pair'}</strong> along
          with all associated words and learning progress.
        </Typography>

        <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
          This action cannot be undone.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete pair'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
