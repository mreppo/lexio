import { useState, useCallback } from 'react'
import { Box, MobileStepper } from '@mui/material'
import type { LanguagePair } from '@/types'
import type { CreatePairInput } from '@/features/language-pairs'
import { WelcomeStep } from './steps/WelcomeStep'
import { LanguagePairStep } from './steps/LanguagePairStep'
import { AddWordsStep } from './steps/AddWordsStep'
import { TutorialStep } from './steps/TutorialStep'

export interface OnboardingFlowProps {
  /** Called when the user completes the flow. */
  readonly onComplete: () => void
  /** Called to create a language pair (delegates to useLanguagePairs). */
  readonly onCreatePair: (input: CreatePairInput) => Promise<LanguagePair>
}

const TOTAL_STEPS = 4

/**
 * Multi-step onboarding wizard shown on first launch (when no language pairs exist).
 * Steps: Welcome → Language Pair → Add Words → Tutorial
 *
 * The flow is linear; each step validates before advancing.
 * The language pair created in Step 2 is passed to Step 3 for pack installation.
 */
export function OnboardingFlow({ onComplete, onCreatePair }: OnboardingFlowProps) {
  const [activeStep, setActiveStep] = useState(0)
  // The pair created in step 2, used in step 3 for starter-pack installation.
  const [createdPair, setCreatedPair] = useState<LanguagePair | null>(null)

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
  }, [])

  const handlePairCreated = useCallback(
    (pair: LanguagePair) => {
      setCreatedPair(pair)
      handleNext()
    },
    [handleNext],
  )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Step content — takes all available vertical space */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeStep === 0 && <WelcomeStep onNext={handleNext} />}
        {activeStep === 1 && (
          <LanguagePairStep onPairCreated={handlePairCreated} onCreatePair={onCreatePair} />
        )}
        {activeStep === 2 && (
          <AddWordsStep createdPair={createdPair} onNext={handleNext} onSkip={handleNext} />
        )}
        {activeStep === 3 && <TutorialStep onComplete={onComplete} />}
      </Box>

      {/* Progress indicator at the bottom */}
      <MobileStepper
        variant="dots"
        steps={TOTAL_STEPS}
        position="static"
        activeStep={activeStep}
        nextButton={<Box sx={{ width: 64 }} />}
        backButton={<Box sx={{ width: 64 }} />}
        sx={{
          justifyContent: 'center',
          bgcolor: 'transparent',
          pb: 2,
          '& .MuiMobileStepper-dot': {
            width: 8,
            height: 8,
            mx: 0.5,
          },
          '& .MuiMobileStepper-dotActive': {
            bgcolor: 'primary.main',
          },
        }}
      />
    </Box>
  )
}
