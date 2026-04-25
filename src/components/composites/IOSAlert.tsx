/**
 * IOSAlert — iOS-native centered alert dialog.
 *
 * iOS uses centered alert dialogs for destructive or data-loss confirmations.
 * This component replaces Material Dialog for those patterns:
 * 14px border-radius, glass backdrop, no Material drop-shadow,
 * hairline separator between Cancel and Confirm, destructive red for the
 * confirm action when `destructive` is true.
 *
 * Used by:
 *   - SettingsScreen: Reset progress, Import confirmation
 *   - DeleteWordDialog: Single and bulk word deletion
 */

import { Dialog, DialogTitle, DialogContent, Button, Typography, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'

export interface IOSAlertProps {
  readonly open: boolean
  readonly title: string
  /** Body content — can be a string or React nodes for rich formatting. */
  readonly message: React.ReactNode
  readonly cancelLabel?: string
  readonly confirmLabel: string
  /** When true, the confirm button uses the red (destructive) color token. */
  readonly destructive?: boolean
  /** When true, both buttons are disabled (e.g. during async confirm action). */
  readonly disabled?: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/**
 * iOS-styled centered alert dialog.
 *
 * This is the correct iOS pattern for destructive confirmations.
 * Material drop-shadow and button shapes are removed. The glass
 * backdrop and 14px border-radius match the native iOS alert appearance.
 */
export function IOSAlert({
  open,
  title,
  message,
  cancelLabel = 'Cancel',
  confirmLabel,
  destructive = false,
  disabled = false,
  onCancel,
  onConfirm,
}: IOSAlertProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      aria-labelledby="ios-alert-title"
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
        id="ios-alert-title"
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
        {title}
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
          {message}
        </Typography>
      </DialogContent>
      <Box
        sx={{
          borderTop: `0.5px solid ${tokens.color.rule2}`,
          display: 'flex',
        }}
      >
        <Button
          onClick={onCancel}
          disabled={disabled}
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
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={disabled}
          sx={{
            flex: 1,
            borderRadius: 0,
            borderBottomRightRadius: '14px',
            fontFamily: glassTypography.body,
            fontSize: '17px',
            fontWeight: 600,
            letterSpacing: '-0.3px',
            color: destructive ? tokens.color.red : tokens.color.accent,
            textTransform: 'none',
            py: '12px',
            '&:hover': { backgroundColor: 'transparent' },
          }}
        >
          {confirmLabel}
        </Button>
      </Box>
    </Dialog>
  )
}
