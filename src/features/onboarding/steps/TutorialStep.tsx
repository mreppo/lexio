import { useState, useCallback } from 'react'
import { Box, Typography, Button, Stack, Paper, MobileStepper } from '@mui/material'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import TouchAppIcon from '@mui/icons-material/TouchApp'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import AutorenewIcon from '@mui/icons-material/Autorenew'

export interface TutorialStepProps {
  readonly onComplete: () => void
}

interface TutorialSlide {
  readonly icon: React.ReactNode
  readonly title: string
  readonly body: string
}

const SLIDES: readonly TutorialSlide[] = [
  {
    icon: <KeyboardIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
    title: 'Type mode',
    body: 'You see a word and type the translation. Lexio accepts minor typos so you can focus on learning, not spelling.',
  },
  {
    icon: <TouchAppIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
    title: 'Choice mode',
    body: 'Pick the correct translation from four options. Great for building recognition quickly.',
  },
  {
    icon: <AutorenewIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
    title: 'Spaced repetition',
    body: 'Words you struggle with appear more often. Words you know well are reviewed less frequently. Your time is spent where it matters.',
  },
  {
    icon: <EmojiEventsIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
    title: 'Daily goal and streaks',
    body: 'Set a daily word target and build a streak by hitting it every day. Consistency is the key to fluency.',
  },
]

/**
 * Step 4 of the onboarding flow.
 * A brief visual walkthrough of the quiz mechanics:
 * type mode, choice mode, spaced repetition, and streaks.
 * Users can page through slides and finish with "Start learning!".
 */
export function TutorialStep({ onComplete }: TutorialStepProps) {
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
        px: 3,
        py: 4,
        maxWidth: 480,
        mx: 'auto',
        width: '100%',
      }}
    >
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          How Lexio works
        </Typography>
        <Typography variant="body2" color="text.secondary">
          A quick tour before you start learning.
        </Typography>
      </Box>

      {/* Slide content */}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          gap: 2,
        }}
      >
        {slide.icon}
        <Typography variant="h6" fontWeight={700}>
          {slide.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {slide.body}
        </Typography>
      </Paper>

      {/* Slide navigation dots */}
      <MobileStepper
        variant="dots"
        steps={SLIDES.length}
        position="static"
        activeStep={slideIndex}
        nextButton={<Box sx={{ width: 48 }} />}
        backButton={<Box sx={{ width: 48 }} />}
        sx={{
          justifyContent: 'center',
          bgcolor: 'transparent',
          py: 2,
          '& .MuiMobileStepper-dotActive': {
            bgcolor: 'primary.main',
          },
        }}
      />

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={slideIndex === 0}
          sx={{ flex: 1, py: 1.5, borderRadius: 2 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          sx={{
            flex: 2,
            py: 1.5,
            borderRadius: 2,
            fontSize: isLastSlide ? '1rem' : undefined,
            bgcolor: isLastSlide ? 'primary.main' : undefined,
          }}
        >
          {isLastSlide ? 'Start learning!' : 'Next'}
        </Button>
      </Stack>

      {/* Skip tutorial link */}
      {!isLastSlide && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button variant="text" size="small" onClick={onComplete} sx={{ color: 'text.secondary' }}>
            Skip tutorial
          </Button>
        </Box>
      )}
    </Box>
  )
}
