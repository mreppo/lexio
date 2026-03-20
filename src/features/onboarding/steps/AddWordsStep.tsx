import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardActionArea,
  CardContent,
} from '@mui/material'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import EditNoteIcon from '@mui/icons-material/EditNote'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { LanguagePair, StarterPack } from '@/types'
import { listPacks, packMatchesPair, installPack } from '@/services/starterPacks'
import { useStorage } from '@/hooks/useStorage'

export interface AddWordsStepProps {
  /** The pair created in step 2. May be null only briefly before the step renders. */
  readonly createdPair: LanguagePair | null
  readonly onNext: () => void
  readonly onSkip: () => void
}

type SelectionState = 'idle' | 'pack' | 'own'

/**
 * Step 3 of the onboarding flow.
 * Offers the user three choices:
 *   A) Load a starter pack (if one is available for the created pair)
 *   B) Add words manually
 *   C) Skip for now
 *
 * When option A is chosen, the pack is installed immediately and the user
 * sees a success message before moving to the next step.
 */
export function AddWordsStep({ createdPair, onNext, onSkip }: AddWordsStepProps) {
  const storage = useStorage()
  const [selection, setSelection] = useState<SelectionState>('idle')
  const [availablePack, setAvailablePack] = useState<StarterPack | null>(null)
  const [loadingPacks, setLoadingPacks] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [installedCount, setInstalledCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Load packs compatible with the created pair on mount.
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const packs = await listPacks()
        if (cancelled || !createdPair) return

        const compatible = packs.find(
          (p) => packMatchesPair(p, createdPair.sourceCode, createdPair.targetCode) !== 'none',
        )
        setAvailablePack(compatible ?? null)
      } catch {
        // Silently ignore pack loading errors — the user can still add words manually.
      } finally {
        if (!cancelled) setLoadingPacks(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [createdPair])

  const handleInstallPack = useCallback(async () => {
    if (!availablePack || !createdPair) return

    setInstalling(true)
    setError(null)

    try {
      const result = await installPack(
        availablePack,
        createdPair.id,
        createdPair.sourceCode,
        createdPair.targetCode,
        storage,
      )
      setInstalledCount(result.added)
      setInstalled(true)
      // Auto-advance after a short delay so the user can read the success message.
      setTimeout(() => {
        onNext()
      }, 1500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setInstalling(false)
    }
  }, [availablePack, createdPair, storage, onNext])

  const handlePackCardClick = useCallback(() => {
    setSelection('pack')
    void handleInstallPack()
  }, [handleInstallPack])

  const handleOwnWordsClick = useCallback(() => {
    setSelection('own')
    onSkip()
  }, [onSkip])

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        px: 3,
        py: 4,
        maxWidth: 480,
        mx: 'auto',
        width: '100%',
      }}
    >
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Add your first words
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start with a curated pack or add your own vocabulary.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loadingPacks ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {availablePack && (
            <Card
              variant="outlined"
              sx={{
                borderColor: selection === 'pack' ? 'primary.main' : 'divider',
                borderWidth: 2,
              }}
            >
              <CardActionArea onClick={handlePackCardClick} disabled={installing || installed}>
                <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ pt: 0.5 }}>
                    {installed ? (
                      <CheckCircleIcon color="success" />
                    ) : installing ? (
                      <CircularProgress size={24} />
                    ) : (
                      <LibraryBooksIcon color="primary" />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {installed
                        ? `Loaded ${installedCount} words!`
                        : `Load starter pack: ${availablePack.name}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {installed
                        ? 'Pack installed successfully.'
                        : `${availablePack.words.length} curated words — ${availablePack.description}`}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          )}

          <Card
            variant="outlined"
            sx={{
              borderColor: selection === 'own' ? 'primary.main' : 'divider',
              borderWidth: 2,
            }}
          >
            <CardActionArea onClick={handleOwnWordsClick} disabled={installing || installed}>
              <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <EditNoteIcon color="primary" sx={{ pt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Add my own words
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Build your vocabulary list from scratch or import from CSV.
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Stack>
      )}

      <Box sx={{ mt: 'auto', pt: 3, textAlign: 'center' }}>
        <Button
          variant="text"
          color="inherit"
          onClick={onSkip}
          disabled={installing}
          sx={{ color: 'text.secondary' }}
        >
          Skip for now
        </Button>
      </Box>
    </Box>
  )
}
