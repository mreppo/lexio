/**
 * TutorialStep — Step 4 of the onboarding flow (Liquid Glass restyle, issue #153).
 *
 * Layout: glass-card carousel. Each slide is a <Glass pad=22 floating strong>
 * with an icon, headline, and body copy. Navigation: Back/Next buttons + slide dots.
 *
 * The carousel uses existing button-based navigation (no swipe introduced).
 * All slide content and step transitions are untouched — render layer only.
 *
 * Slide dots reuse <StepPagination totalSteps=4 label="Tutorial slides"> to
 * keep the capsule dot logic in one place.
 *
 * All values flow from tokens. No hardcoded colours or spacing.
 */

import { useState, useCallback } from 'react'
import { Box } from '@mui/material'
import { Keyboard, PointerIcon, RefreshCcw, Trophy } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import { Glass } from '@/components/primitives/Glass'
import { Btn } from '@/components/atoms/Btn'
import { StepPagination } from '../components/StepPagination'
import { StepHeader } from '../components/StepHeader'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TutorialStepProps {
  readonly onComplete: () => void
}

interface TutorialSlide {
  readonly icon: React.ReactNode
  readonly title: string
  readonly body: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIDES: readonly TutorialSlide[] = [
  {
    icon: <Keyboard size={48} strokeWidth={1.5} aria-hidden="true" />,
    title: 'Type mode',
    body: 'You see a word and type the translation. Lexio accepts minor typos so you can focus on learning, not spelling.',
  },
  {
    icon: <PointerIcon size={48} strokeWidth={1.5} aria-hidden="true" />,
    title: 'Choice mode',
    body: 'Pick the correct translation from four options. Great for building recognition quickly.',
  },
  {
    icon: <RefreshCcw size={48} strokeWidth={1.5} aria-hidden="true" />,
    title: 'Spaced repetition',
    body: 'Words you struggle with appear more often. Words you know well are reviewed less frequently. Your time is spent where it matters.',
  },
  {
    icon: <Trophy size={48} strokeWidth={1.5} aria-hidden="true" />,
    title: 'Daily goal and streaks',
    body: 'Set a daily word target and build a streak by hitting it every day. Consistency is the key to fluency.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function TutorialStep({ onComplete }: TutorialStepProps) {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)
  const [slideIndex, setSlideIndex] = useState(0)
  const isLastSlide = slideIndex === SLIDES.length - 1
  const slide = SLIDES[slideIndex]

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onComplete()
    } else {
      setSlideIndex((prev) => prev + 1)
    }
  }, [isLastSlide, onComplete])

  const handleBack = useCallback(() => {
    setSlideIndex((prev) => Math.max(0, prev - 1))
  }, [])

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        pt: '72px',
        px: '16px',
        pb: '32px',
      }}
    >
      {/* Header */}
      <StepHeader
        title="How Lexio works"
        subtitle="A quick tour before you start learning."
        paddingX={8}
      />

      {/* Slide — Glass pad=22 floating strong */}
      <Glass
        pad={22}
        floating
        strong
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        {/* aria-live region so screen readers announce slide changes */}
        <Box
          component="section"
          aria-live="polite"
          aria-label={`Slide ${slideIndex + 1} of ${SLIDES.length}: ${slide.title}`}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
          }}
        >
          {/* Icon */}
          <Box sx={{ color: tokens.color.accent }} aria-hidden="true">
            {slide.icon}
          </Box>

          {/* Title */}
          <Box
            component="h2"
            sx={{
              margin: 0,
              fontFamily: glassTypography.display,
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              color: tokens.color.ink,
            }}
          >
            {slide.title}
          </Box>

          {/* Body */}
          <Box
            component="p"
            sx={{
              margin: 0,
              fontFamily: glassTypography.body,
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '-0.2px',
              lineHeight: 1.6,
              color: tokens.color.inkSoft,
              maxWidth: '300px',
            }}
          >
            {slide.body}
          </Box>

          {/* Slide dots — reuses StepPagination for the capsule dot pattern */}
          <StepPagination
            activeStep={slideIndex}
            totalSteps={SLIDES.length}
            label="Tutorial slides"
            sx={{ py: '4px', mt: '4px' }}
          />
        </Box>
      </Glass>

      {/* Navigation buttons */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          mt: '16px',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Btn kind="glass" size="md" full onClick={handleBack} disabled={slideIndex === 0}>
            Back
          </Btn>
        </Box>

        <Box sx={{ flex: 2 }}>
          <Btn kind="filled" size="md" full onClick={handleNext}>
            {isLastSlide ? 'Start learning!' : 'Next'}
          </Btn>
        </Box>
      </Box>

      {/* Skip tutorial — only on non-last slides */}
      {!isLastSlide && (
        <Box sx={{ textAlign: 'center', mt: '12px' }}>
          <Btn kind="glass" size="sm" onClick={onComplete}>
            Skip tutorial
          </Btn>
        </Box>
      )}
    </Box>
  )
}
