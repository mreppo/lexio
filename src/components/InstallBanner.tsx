import { useState } from 'react'
import { Snackbar, Button, IconButton, Box, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import GetAppIcon from '@mui/icons-material/GetApp'
import { IosInstallInstructions } from './IosInstallInstructions'
import type { InstallPlatform } from '../hooks/useInstallPrompt'

interface InstallBannerProps {
  /** Whether the banner should be visible. */
  open: boolean
  /** The detected platform — controls which install path is used. */
  platform: InstallPlatform
  /**
   * Called when the user taps "Install".
   * On Android/desktop this resolves after the native prompt; on iOS the
   * component opens the step-by-step instructions modal instead.
   */
  onInstall: () => Promise<void>
  /** Called when the user dismisses the banner. */
  onDismiss: () => void
}

/**
 * Platform-aware PWA install banner.
 *
 * Renders as a bottom-sheet snackbar above the BottomNav bar.
 * - On Android/desktop Chromium: tapping "Install" fires the native
 *   `beforeinstallprompt` dialog captured by useInstallPrompt.
 * - On iOS Safari: tapping "Install" opens a step-by-step instructions modal.
 * - On other browsers: shows a generic "Install" button (no-op trigger).
 */
export function InstallBanner({ open, platform, onInstall, onDismiss }: InstallBannerProps) {
  const [iosModalOpen, setIosModalOpen] = useState(false)

  function handleInstallClick(): void {
    if (platform === 'ios-safari') {
      setIosModalOpen(true)
      return
    }
    void onInstall()
  }

  function handleIosModalClose(): void {
    setIosModalOpen(false)
    // Once the user has seen the instructions and closed the modal, dismiss
    // the banner — they know what to do now.
    onDismiss()
  }

  return (
    <>
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        // Never auto-hide — the user must act on this.
        sx={{
          // Lift above the BottomNav bar (56 px) + safe-area on iOS + small gap.
          bottom: { xs: 'calc(56px + env(safe-area-inset-bottom) + 8px)', sm: 24 },
        }}
      >
        <Box
          role="region"
          aria-label="Install Lexio"
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
            borderColor: 'primary.main',
            maxWidth: 360,
            width: '100%',
          }}
        >
          <GetAppIcon fontSize="small" color="primary" sx={{ flexShrink: 0 }} />

          <Typography variant="body2" sx={{ flex: 1 }}>
            Install Lexio for quick access
          </Typography>

          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={handleInstallClick}
            sx={{ flexShrink: 0, minHeight: 32, px: 1.5 }}
          >
            Install
          </Button>

          <IconButton
            size="small"
            aria-label="Dismiss install banner"
            onClick={onDismiss}
            sx={{ flexShrink: 0 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Snackbar>

      {/* iOS-specific step-by-step instructions modal */}
      <IosInstallInstructions open={iosModalOpen} onClose={handleIosModalClose} />
    </>
  )
}
