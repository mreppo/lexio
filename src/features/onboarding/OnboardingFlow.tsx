import { useState, useCallback, useEffect } from 'react'
import { Box, MobileStepper } from '@mui/material'
import type { LanguagePair } from '@/types'
import type { CreatePairInput } from '@/features/language-pairs'
import { WelcomeStep } from './steps/WelcomeStep'
import { LanguagePairStep } from './steps/LanguagePairStep'
import { AddWordsStep } from './steps/AddWordsStep'
import { TutorialStep } from './steps/TutorialStep'
import { loadPack, installPack } from '@/services/starterPacks'
import { useStorage } from '@/hooks/useStorage'

export interface OnboardingFlowProps {
  /** Called when the user completes the flow. Provides the active tab to navigate to. */
  readonly onComplete: (goToTab?: 'quiz') => void
  /** Called to create a language pair (delegates to useLanguagePairs). */
  readonly onCreatePair: (input: CreatePairInput) => Promise<LanguagePair>
  /**
   * When true, skips the Welcome step and immediately executes the instant demo flow.
   * Useful for deep links like `?demo=true` from a landing page.
   */
  readonly autoDemo?: boolean
}

/**
 * The A1 English-Latvian pack ID used for the instant demo path.
 * Source lang is Latvian (lv), target is English (en) in the pack file.
 * The demo creates the pair as source=Latvian, target=English to match the pack direction.
 */
const DEMO_PACK_ID = 'en-lv-a1'

/**
 * The language pair auto-created for the instant demo.
 * Latvian as the language being learned, English as the known language.
 * Matches the confirmed product decision: EN-LV, source=Latvian, target=English.
 */
const DEMO_PAIR_INPUT: CreatePairInput = {
  sourceLang: 'Latvian',
  sourceCode: 'lv',
  targetLang: 'English',
  targetCode: 'en',
}

/**
 * Steps in the manual onboarding flow (Welcome is step 0 but not counted in stepper).
 * Manual flow: Welcome (0) → Language Pair (1) → Add Words (2) → Tutorial (3)
 * The MobileStepper shows 3 dots for steps 1-3.
 */
const MANUAL_STEPS = 3

/**
 * Multi-step onboarding wizard shown on first launch (when no language pairs exist).
 *
 * Two paths:
 *   1. Instant demo — tap "Try it now" on Welcome → auto-creates EN-LV pair + A1 pack → quiz
 *   2. Manual setup — tap "Set up my own" on Welcome → Language Pair → Add Words → Tutorial
 *
 * The flow can also auto-trigger the demo path via the `autoDemo` prop (used for `?demo=true`).
 */
export function OnboardingFlow({
  onComplete,
  onCreatePair,
  autoDemo = false,
}: OnboardingFlowProps) {
  const storage = useStorage()
  // activeStep: 0=Welcome, 1=LanguagePair, 2=AddWords, 3=Tutorial
  const [activeStep, setActiveStep] = useState(0)
  // The pair created in step 1, used in step 2 for starter-pack installation.
  const [createdPair, setCreatedPair] = useState<LanguagePair | null>(null)
  // Loading state for the instant demo path.
  const [demoLoading, setDemoLoading] = useState(false)

  /**
   * Executes the instant demo: creates the EN-LV pair, installs the A1 pack,
   * then calls onComplete with a signal to navigate to the quiz tab.
   */
  const runInstantDemo = useCallback(async () => {
    setDemoLoading(true)
    try {
      const pair = await onCreatePair(DEMO_PAIR_INPUT)
      const pack = await loadPack(DEMO_PACK_ID)
      await installPack(pack, pair.id, pair.sourceCode, pair.targetCode, storage)
      onComplete('quiz')
    } catch {
      // If demo setup fails, fall back to manual flow.
      setDemoLoading(false)
      setActiveStep(1)
    }
  }, [onCreatePair, storage, onComplete])

  // When autoDemo is set (e.g. ?demo=true deep link), run the demo immediately.
  useEffect(() => {
    if (autoDemo) {
      void runInstantDemo()
    }
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, MANUAL_STEPS))
  }, [])

  const handlePairCreated = useCallback(
    (pair: LanguagePair) => {
      setCreatedPair(pair)
      handleNext()
    },
    [handleNext],
  )

  const handleManualSetup = useCallback(() => {
    setActiveStep(1)
  }, [])

  // The stepper shows progress for steps 1-3 (manual path). Welcome (0) has no dot.
  // stepperActiveStep maps: step1 → 0, step2 → 1, step3 → 2
  const stepperActiveStep = Math.max(0, activeStep - 1)
  const showStepper = activeStep > 0

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
        {activeStep === 0 && (
          <WelcomeStep
            onDemo={() => void runInstantDemo()}
            onManualSetup={handleManualSetup}
            demoLoading={demoLoading}
          />
        )}
        {activeStep === 1 && (
          <LanguagePairStep onPairCreated={handlePairCreated} onCreatePair={onCreatePair} />
        )}
        {activeStep === 2 && (
          <AddWordsStep createdPair={createdPair} onNext={handleNext} onSkip={handleNext} />
        )}
        {activeStep === 3 && <TutorialStep onComplete={() => onComplete()} />}
      </Box>

      {/* Progress indicator — only shown during the manual 3-step flow */}
      {showStepper && (
        <MobileStepper
          variant="dots"
          steps={MANUAL_STEPS}
          position="static"
          activeStep={stepperActiveStep}
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
      )}
    </Box>
  )
}
