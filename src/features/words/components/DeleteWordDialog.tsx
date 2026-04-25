/**
 * DeleteWordDialog — iOS-styled centered alert for deleting one or more words (issue #187).
 *
 * Uses the shared IOSAlert component from src/components/composites/IOSAlert.tsx.
 * Centered confirmation alert is the correct iOS pattern for destructive actions.
 */

import { useCallback } from 'react'
import { IOSAlert } from '@/components/composites/IOSAlert'

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
 * iOS-styled centered alert dialog for deleting one or more words.
 * Uses the shared IOSAlert primitive — no custom Dialog markup here.
 */
export function DeleteWordDialog({
  open,
  count,
  wordLabel,
  onClose,
  onConfirm,
}: DeleteWordDialogProps) {
  const isBulk = count > 1

  const handleConfirm = useCallback(async () => {
    await onConfirm()
    onClose()
  }, [onConfirm, onClose])

  const message = isBulk
    ? `Are you sure you want to delete these ${count} words? This cannot be undone.`
    : `Are you sure you want to delete "${wordLabel}"? This cannot be undone.`

  return (
    <IOSAlert
      open={open}
      title={`Delete ${isBulk ? `${count} words` : 'word'}?`}
      message={message}
      cancelLabel="Cancel"
      confirmLabel="Delete"
      destructive
      onCancel={onClose}
      onConfirm={() => {
        void handleConfirm()
      }}
    />
  )
}
