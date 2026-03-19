import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { StarterPack } from '@/types'
import { listPacks, installPack, packMatchesPair } from '@/services/starterPacks'
import type { InstallPackResult } from '@/services/starterPacks'
import { useStorage } from '@/hooks/useStorage'

export interface PackBrowserDialogProps {
  readonly open: boolean
  readonly pairId: string | null
  /** ISO language code for the active pair's source language (e.g. "en", "lv"). */
  readonly pairSourceCode: string | null
  /** ISO language code for the active pair's target language (e.g. "en", "lv"). */
  readonly pairTargetCode: string | null
  readonly onClose: () => void
  /** Called after words have been successfully installed so the caller can refresh word list. */
  readonly onInstalled: () => void
}

interface PackInstallState {
  readonly status: 'idle' | 'installing' | 'done'
  readonly result: InstallPackResult | null
}

/**
 * Dialog that lets the user browse available starter packs and install one.
 * Packs are loaded from the public directory via fetch.
 *
 * Uses packMatchesPair to filter packs to only those compatible with the active
 * language pair (in either direction). When installing a reversed pack the
 * service layer swaps source/target automatically.
 */
export function PackBrowserDialog({
  open,
  pairId,
  pairSourceCode,
  pairTargetCode,
  onClose,
  onInstalled,
}: PackBrowserDialogProps) {
  const storage = useStorage()

  const [allPacks, setAllPacks] = useState<readonly StarterPack[]>([])
  const [loadingPacks, setLoadingPacks] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Per-pack install state keyed by pack id.
  const [installStates, setInstallStates] = useState<Record<string, PackInstallState>>({})

  // Tracks the auto-close timer so it can be cleared on unmount.
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear the auto-close timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current !== null) {
        clearTimeout(autoCloseTimerRef.current)
      }
    }
  }, [])

  // Load packs whenever the dialog opens.
  useEffect(() => {
    if (!open) return

    setLoadingPacks(true)
    setLoadError(null)
    setInstallStates({})

    listPacks()
      .then((loaded) => {
        setAllPacks(loaded)
        setLoadingPacks(false)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setLoadError(message)
        setLoadingPacks(false)
      })
  }, [open])

  // Filter to only packs compatible with the active pair (same or reversed direction).
  const packs =
    pairSourceCode !== null && pairTargetCode !== null
      ? allPacks.filter(
          (pack) => packMatchesPair(pack, pairSourceCode, pairTargetCode) !== 'none',
        )
      : allPacks

  const handleInstall = useCallback(
    async (pack: StarterPack) => {
      if (!pairId || !pairSourceCode || !pairTargetCode) return

      setInstallStates((prev) => ({
        ...prev,
        [pack.id]: { status: 'installing', result: null },
      }))

      try {
        const result = await installPack(pack, pairId, pairSourceCode, pairTargetCode, storage)
        setInstallStates((prev) => ({
          ...prev,
          [pack.id]: { status: 'done', result },
        }))
        // Refresh the word list immediately so it is populated when the dialog closes.
        onInstalled()
        // Auto-close after a brief delay so the user can read the success message.
        autoCloseTimerRef.current = setTimeout(() => {
          onClose()
        }, 1500)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setInstallStates((prev) => ({
          ...prev,
          [pack.id]: { status: 'idle', result: null },
        }))
        setLoadError(message)
      }
    },
    [pairId, pairSourceCode, pairTargetCode, storage, onInstalled, onClose],
  )

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Browse starter packs</DialogTitle>

      <DialogContent dividers>
        {loadingPacks && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {loadError && !loadingPacks && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}

        {!loadingPacks && !loadError && packs.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No starter packs available.
          </Typography>
        )}

        {!loadingPacks && packs.length > 0 && (
          <Stack spacing={2} divider={<Divider />}>
            {packs.map((pack) => {
              const state = installStates[pack.id] ?? { status: 'idle', result: null }
              const isInstalling = state.status === 'installing'
              const isDone = state.status === 'done'

              return (
                <Box key={pack.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {pack.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {pack.description}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={pack.level} size="small" color="primary" variant="outlined" />
                        <Chip
                          label={`${pack.words.length} words`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>

                    <Box sx={{ flexShrink: 0, pt: 0.5 }}>
                      {isDone ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={isInstalling ? <CircularProgress size={14} /> : <DownloadIcon />}
                          onClick={() => void handleInstall(pack)}
                          disabled={isInstalling || !pairId}
                        >
                          Install
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {isDone && state.result && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      Added {state.result.added} words
                      {state.result.skipped > 0 ? `, skipped ${state.result.skipped} duplicates` : ''}.
                    </Alert>
                  )}
                </Box>
              )
            })}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
