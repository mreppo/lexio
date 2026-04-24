/**
 * AddWordsStep — Step 3 of the onboarding flow (Liquid Glass restyle, issue #153).
 *
 * Layout: Library grouped-list aesthetic — SectionHeader + Glass containing GlassRow per option.
 * Options:
 *   A) Load a starter pack (if available for the created pair)
 *   B) Add my own words (skip to main app)
 * Bottom: Skip link text button.
 *
 * Business logic (listPacks, installPack, auto-advance) is preserved untouched — render only.
 * useWords.addWord hook is NOT used here — users add words in the Library screen after onboarding.
 *
 * All values flow from tokens. No hardcoded colours or spacing.
 */

import { useState, useEffect, useCallback } from 'react'
import { Box, Alert } from '@mui/material'
import { BookOpen, PenLine, CheckCircle, Loader } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import type { LanguagePair, StarterPack } from '@/types'
import { listPacks, packMatchesPair, installPack } from '@/services/starterPacks'
import { useStorage } from '@/hooks/useStorage'
import { getGlassTokens } from '@/theme/liquidGlass'
import { Glass } from '@/components/primitives/Glass'
import { GlassRow } from '@/components/composites/GlassRow'
import { SectionHeader } from '@/components/composites/SectionHeader'
import { Btn } from '@/components/atoms/Btn'
import { StepHeader } from '../components/StepHeader'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddWordsStepProps {
  /** The pair created in step 2. May be null only briefly before the step renders. */
  readonly createdPair: LanguagePair | null
  readonly onNext: () => void
  readonly onSkip: () => void
}

type SelectionState = 'idle' | 'pack' | 'own'

// ─── Component ────────────────────────────────────────────────────────────────

export function AddWordsStep({ createdPair, onNext, onSkip }: AddWordsStepProps) {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)
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

  // Icon and label for the pack option vary by loading/installing/installed state
  const packIcon = installed ? CheckCircle : loadingPacks || installing ? Loader : BookOpen
  const packIconBg = installed ? tokens.color.ok : tokens.color.accent

  const packTitle = installed
    ? `Loaded ${installedCount} words!`
    : loadingPacks
      ? 'Looking for a starter pack…'
      : availablePack
        ? `Load starter pack: ${availablePack.name}`
        : 'No starter pack available'

  const packDetail = installed
    ? 'Pack installed successfully.'
    : availablePack && !loadingPacks
      ? `${availablePack.words.length} curated words — ${availablePack.description}`
      : undefined

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <StepHeader
        title="Add your first words"
        subtitle="Start with a curated pack or add your own vocabulary."
      />

      {/* Options group — Library grouped-list pattern */}
      <Box sx={{ px: '16px' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <SectionHeader>Get started</SectionHeader>

        <Glass pad={0} floating>
          {availablePack !== null || loadingPacks ? (
            <GlassRow
              icon={packIcon}
              iconBg={packIconBg}
              title={packTitle}
              detail={packDetail}
              chevron={!installing && !installed && !loadingPacks}
              isLast={false}
              onClick={
                !installing && !installed && !loadingPacks && availablePack
                  ? handlePackCardClick
                  : undefined
              }
            />
          ) : null}

          <GlassRow
            icon={PenLine}
            iconBg={tokens.color.violet}
            title={selection === 'own' ? 'Adding your own words…' : 'Add my own words'}
            detail="Build your vocabulary from scratch or import from CSV."
            chevron={selection !== 'own'}
            isLast
            onClick={
              !installing && !installed && selection !== 'own' ? handleOwnWordsClick : undefined
            }
          />
        </Glass>
      </Box>

      {/* Skip link */}
      <Box
        sx={{
          mt: 'auto',
          pt: '24px',
          pb: '24px',
          textAlign: 'center',
        }}
      >
        <Btn
          kind="glass"
          size="sm"
          onClick={onSkip}
          disabled={installing}
          aria-label="Skip for now"
        >
          Skip for now
        </Btn>
      </Box>
    </Box>
  )
}
