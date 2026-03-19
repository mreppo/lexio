import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material'

export interface DeleteWordDialogProps {
  readonly open: boolean
  /** Number of words to delete. Used to customise dialog text. */
  readonly count: number
  /** Display label for the word (source word text) when deleting a single word. */
  readonly wordLabel?: string
  readonly onClose: () => void
  readonly onConfirm: () => Promise<void>
}

/**
 * Confirmation dialog for deleting one or more words.
 */
export function DeleteWordDialog({
  open,
  count,
  wordLabel,
  onClose,
  onConfirm,
}: DeleteWordDialogProps) {
  const isBulk = count > 1

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete {isBulk ? `${count} words` : 'word'}?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {isBulk
            ? `Are you sure you want to delete these ${count} words? This cannot be undone.`
            : `Are you sure you want to delete "${wordLabel}"? This cannot be undone.`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={async () => {
            await onConfirm()
            onClose()
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
