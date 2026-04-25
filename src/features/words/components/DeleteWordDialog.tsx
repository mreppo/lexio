/**
 * DeleteWordDialog — iOS-styled centered alert for deleting one or more words (issue #187).
 *
 * Centered confirmation alert is the correct iOS pattern for destructive actions.
 * Material look removed: no drop-shadow, native-looking destructive action,
 * glass backdrop, 14px border-radius per iOS alert spec.
 *
 * Keeps: centered positioning, cancel + destructive confirm two-button layout.
 */

import { Dialog, DialogTitle, DialogContent, Button, Typography, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'

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
 * Destructive confirm button uses the red color token.
 */
export function DeleteWordDialog({
  open,
  count,
  wordLabel,
  onClose,
  onConfirm,
}: DeleteWordDialogProps) {
  const isBulk = count > 1
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="delete-word-alert-title"
      slotProps={{
        paper: {
          sx: {
            borderRadius: '14px',
            background:
              theme.palette.mode === 'dark' ? 'rgba(28,28,30,0.98)' : 'rgba(242,242,247,0.98)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            boxShadow: 'none',
            border: `0.5px solid ${tokens.glass.border}`,
          },
        },
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
          },
        },
      }}
    >
      <DialogTitle
        id="delete-word-alert-title"
        sx={{
          textAlign: 'center',
          pt: '20px',
          pb: '4px',
          px: '16px',
          fontFamily: glassTypography.body,
          fontSize: '17px',
          fontWeight: 600,
          letterSpacing: '-0.3px',
          color: tokens.color.ink,
        }}
      >
        Delete {isBulk ? `${count} words` : 'word'}?
      </DialogTitle>
      <DialogContent sx={{ pt: '4px', pb: '16px', px: '16px', textAlign: 'center' }}>
        <Typography
          sx={{
            fontFamily: glassTypography.body,
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '-0.1px',
            color: tokens.color.inkSec,
            lineHeight: 1.4,
          }}
        >
          {isBulk
            ? `Are you sure you want to delete these ${count} words? This cannot be undone.`
            : `Are you sure you want to delete "${wordLabel}"? This cannot be undone.`}
        </Typography>
      </DialogContent>
      <Box
        sx={{
          borderTop: `0.5px solid ${tokens.color.rule2}`,
          display: 'flex',
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            flex: 1,
            borderRadius: 0,
            borderBottomLeftRadius: '14px',
            fontFamily: glassTypography.body,
            fontSize: '17px',
            fontWeight: 400,
            letterSpacing: '-0.3px',
            color: tokens.color.accent,
            textTransform: 'none',
            py: '12px',
            borderRight: `0.5px solid ${tokens.color.rule2}`,
            '&:hover': { backgroundColor: 'transparent' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={async () => {
            await onConfirm()
            onClose()
          }}
          sx={{
            flex: 1,
            borderRadius: 0,
            borderBottomRightRadius: '14px',
            fontFamily: glassTypography.body,
            fontSize: '17px',
            fontWeight: 600,
            letterSpacing: '-0.3px',
            color: tokens.color.red,
            textTransform: 'none',
            py: '12px',
            '&:hover': { backgroundColor: 'transparent' },
          }}
        >
          Delete
        </Button>
      </Box>
    </Dialog>
  )
}
