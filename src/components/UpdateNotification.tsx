import { Snackbar, Button, IconButton, Box, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt'

interface UpdateNotificationProps {
  /** Whether the update notification should be visible. */
  open: boolean
  /** Called when the user taps "Update". */
  onUpdate: () => void
  /** Called when the user dismisses the notification. */
  onDismiss: () => void
}

/**
 * Non-intrusive snackbar shown when a new service worker version is available.
 * Appears at the bottom of the screen with an "Update" action and a dismiss button.
 */
export function UpdateNotification({ open, onUpdate, onDismiss }: UpdateNotificationProps) {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      // Keep the notification visible until the user acts — no auto-hide.
      // This is intentional: we don't want the update silently ignored if the
      // user doesn't notice it in time.
      sx={{
        // Lift above the BottomNav bar (56 px) plus a small gap.
        bottom: { xs: 'calc(56px + env(safe-area-inset-bottom) + 8px)', sm: 24 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 4,
          border: '1px solid',
          borderColor: 'divider',
          maxWidth: 360,
        }}
      >
        <SystemUpdateAltIcon fontSize="small" color="primary" sx={{ flexShrink: 0 }} />

        <Typography variant="body2" sx={{ flex: 1 }}>
          New version available
        </Typography>

        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={onUpdate}
          sx={{ flexShrink: 0, minHeight: 32, px: 1.5 }}
        >
          Update
        </Button>

        <IconButton
          size="small"
          aria-label="Dismiss update notification"
          onClick={onDismiss}
          sx={{ flexShrink: 0 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Snackbar>
  )
}
