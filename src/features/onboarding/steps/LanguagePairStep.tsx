/**
 * LanguagePairStep — Step 2 of the onboarding flow (Liquid Glass restyle, issue #153).
 *
 * Design spec (01-onboarding.png):
 *   - Header block: padding-top 72, horizontal 24 — title + subhead
 *   - Card list: padding-top 28, horizontal 16 — one <Glass pad=12 floating> card per preset pair
 *   - Each card: 46×46 gradient square + label (17/600) + sub (13/inkSec) + 24×24 radio circle
 *   - Selected card: <Glass strong> + 2px accent border + filled accent radio with white check
 *   - CTA "Continue": <Btn filled full lg> positioned absolute at bottom 46, left/right 16
 *
 * Language-pair gradients from glassColors.pairGradients (keyed by target lang code, lowercase).
 * Falls back to avatarGradient for unknown codes (e.g. 'lv' for the EN-LV default).
 *
 * Business logic (handleSubmit, onCreatePair) is preserved untouched — render layer only.
 * The Autocomplete custom-pair form is removed; users select from presets only.
 * The default EN→LV pair (lv) is pre-selected so first-time users can tap Continue immediately.
 */

import { useState, useCallback } from 'react'
import { Box, Alert } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Check } from 'lucide-react'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import { Glass } from '@/components/primitives/Glass'
import { Btn } from '@/components/atoms/Btn'
import type { CreatePairInput } from '@/features/language-pairs'
import type { LanguagePair } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LanguagePairStepProps {
  readonly onPairCreated: (pair: LanguagePair) => void
  readonly onCreatePair: (input: CreatePairInput) => Promise<LanguagePair>
}

interface PairPreset {
  readonly label: string
  readonly subLabel: string
  readonly source: string
  readonly sourceCode: string
  readonly target: string
  readonly targetCode: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Preset pairs shown as cards. Ordered by common usage.
 * The code used for gradient lookup is targetCode.
 */
const PRESET_PAIRS: readonly PairPreset[] = [
  {
    label: 'English → Latvian',
    subLabel: 'EN → LV',
    source: 'English',
    sourceCode: 'en',
    target: 'Latvian',
    targetCode: 'lv',
  },
  {
    label: 'English → Spanish',
    subLabel: 'EN → ES',
    source: 'English',
    sourceCode: 'en',
    target: 'Spanish',
    targetCode: 'es',
  },
  {
    label: 'English → French',
    subLabel: 'EN → FR',
    source: 'English',
    sourceCode: 'en',
    target: 'French',
    targetCode: 'fr',
  },
  {
    label: 'English → German',
    subLabel: 'EN → DE',
    source: 'English',
    sourceCode: 'en',
    target: 'German',
    targetCode: 'de',
  },
  {
    label: 'English → Japanese',
    subLabel: 'EN → JA',
    source: 'English',
    sourceCode: 'en',
    target: 'Japanese',
    targetCode: 'ja',
  },
] as const

/**
 * Gradient square size per design spec.
 */
const GRADIENT_SQUARE_SIZE = 46

/**
 * Radio circle outer size per design spec.
 */
const RADIO_SIZE = 24

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the pair gradient for a given target language code.
 * Falls back to avatarGradient for codes not in the map
 * (e.g. 'lv' for EN-LV is intentionally not in the spec's list).
 */
function getPairGradient(
  targetCode: string,
  pairGradients: Record<string, string>,
  avatarGradient: string,
): string {
  const code = targetCode.toLowerCase()
  return pairGradients[code] ?? avatarGradient
}

// ─── Sub-component: PairCard ──────────────────────────────────────────────────

interface PairCardProps {
  readonly preset: PairPreset
  readonly isSelected: boolean
  readonly onSelect: (preset: PairPreset) => void
  readonly gradient: string
  readonly tokens: ReturnType<typeof getGlassTokens>
  readonly isLast: boolean
}

function PairCard({
  preset,
  isSelected,
  onSelect,
  gradient,
  tokens,
  isLast,
}: PairCardProps): React.JSX.Element {
  const handleClick = useCallback(() => {
    onSelect(preset)
  }, [onSelect, preset])

  return (
    <Glass
      pad={12}
      floating
      strong={isSelected}
      sx={
        isSelected
          ? {
              border: `2px solid ${tokens.color.accent}`,
              // Compensate so the border doesn't shift layout
              margin: '-2px',
            }
          : undefined
      }
    >
      <Box
        component="button"
        type="button"
        role="radio"
        aria-checked={isSelected}
        aria-label={preset.label}
        onClick={handleClick}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '14px',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          // Hairline divider at bottom — only between cards, not after last
          '&::after': isLast
            ? { display: 'none' }
            : {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: `${GRADIENT_SQUARE_SIZE + 12 + 14}px`,
                right: 0,
                height: '0.5px',
                backgroundColor: tokens.color.rule2,
                pointerEvents: 'none',
              },
        }}
      >
        {/* 46×46 gradient square */}
        <Box
          aria-hidden="true"
          sx={{
            flexShrink: 0,
            width: `${GRADIENT_SQUARE_SIZE}px`,
            height: `${GRADIENT_SQUARE_SIZE}px`,
            borderRadius: '10px',
            background: gradient,
          }}
        />

        {/* Label + sub column */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            component="span"
            sx={{
              display: 'block',
              fontFamily: glassTypography.body,
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.3px',
              lineHeight: 1.3,
              color: tokens.color.ink,
            }}
          >
            {preset.label}
          </Box>
          <Box
            component="span"
            sx={{
              display: 'block',
              fontFamily: glassTypography.body,
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '-0.1px',
              lineHeight: 1.3,
              color: tokens.color.inkSec,
              mt: '2px',
            }}
          >
            {preset.subLabel}
          </Box>
        </Box>

        {/* 24×24 radio circle */}
        <Box
          aria-hidden="true"
          sx={{
            flexShrink: 0,
            width: `${RADIO_SIZE}px`,
            height: `${RADIO_SIZE}px`,
            borderRadius: '50%',
            backgroundColor: isSelected ? tokens.color.accent : 'transparent',
            border: isSelected ? 'none' : `2px solid ${tokens.color.rule2}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isSelected && <Check size={14} strokeWidth={3} color="#ffffff" aria-hidden="true" />}
        </Box>
      </Box>
    </Glass>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LanguagePairStep({ onPairCreated, onCreatePair }: LanguagePairStepProps) {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  // Default to EN→LV (first preset) so the user can tap Continue immediately
  const [selectedPreset, setSelectedPreset] = useState<PairPreset>(PRESET_PAIRS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = useCallback((preset: PairPreset) => {
    setSelectedPreset(preset)
    setError(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    setError(null)
    setSubmitting(true)
    try {
      const pair = await onCreatePair({
        sourceLang: selectedPreset.source,
        sourceCode: selectedPreset.sourceCode.toLowerCase(),
        targetLang: selectedPreset.target,
        targetCode: selectedPreset.targetCode.toLowerCase(),
      })
      onPairCreated(pair)
    } catch {
      setError('Failed to create language pair. Please try again.')
      setSubmitting(false)
    }
  }, [selectedPreset, onCreatePair, onPairCreated])

  return (
    // Position relative so the absolute Continue button can anchor here
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        // Extra bottom padding so content doesn't hide under the absolute CTA
        pb: '110px',
      }}
    >
      {/* Header block — padding-top 72, horizontal 24 */}
      <Box
        sx={{
          pt: '72px',
          px: '24px',
        }}
      >
        <Box
          component="h1"
          sx={{
            margin: 0,
            fontFamily: glassTypography.display,
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.6px',
            lineHeight: 1.1,
            color: tokens.color.ink,
            mb: '8px',
          }}
        >
          Choose your language pair
        </Box>
        <Box
          component="p"
          sx={{
            margin: 0,
            fontFamily: glassTypography.body,
            fontSize: '16px',
            fontWeight: 500,
            letterSpacing: '-0.2px',
            lineHeight: 1.5,
            color: tokens.color.inkSoft,
          }}
        >
          Select the language you want to learn.
        </Box>
      </Box>

      {/* Card list — padding-top 28, horizontal 16 */}
      <Box
        sx={{
          pt: '28px',
          px: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
        role="radiogroup"
        aria-label="Language pair selection"
      >
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        {PRESET_PAIRS.map((preset, index) => {
          const gradient = getPairGradient(
            preset.targetCode,
            tokens.color.pairGradients,
            tokens.color.avatarGradient,
          )
          return (
            <PairCard
              key={preset.targetCode}
              preset={preset}
              isSelected={selectedPreset.targetCode === preset.targetCode}
              onSelect={handleSelect}
              gradient={gradient}
              tokens={tokens}
              isLast={index === PRESET_PAIRS.length - 1}
            />
          )
        })}
      </Box>

      {/* Absolute Continue CTA — bottom 46, left/right 16 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '46px',
          left: '16px',
          right: '16px',
        }}
      >
        <Btn
          kind="filled"
          size="lg"
          full
          onClick={() => {
            void handleSubmit()
          }}
          disabled={submitting}
        >
          {submitting ? 'Creating…' : 'Continue'}
        </Btn>
      </Box>
    </Box>
  )
}
