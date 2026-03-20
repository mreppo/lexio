import { Box, Typography, Button } from '@mui/material'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'

export interface WelcomeStepProps {
  readonly onNext: () => void
}

/**
 * Step 1 of the onboarding flow.
 * Displays the app name, tagline, and a "Get started" call to action.
 * Clean, inviting layout centred on the screen.
 */
export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        textAlign: 'center',
        gap: 3,
      }}
    >
      <AutoStoriesIcon sx={{ fontSize: 80, color: 'primary.main' }} />

      <Box>
        <Typography variant="h3" component="h1" gutterBottom>
          Lexio
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, lineHeight: 1.5 }}>
          Learn vocabulary in any language through active recall and spaced repetition.
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        onClick={onNext}
        sx={{ mt: 2, px: 6, py: 1.5, borderRadius: 3, fontSize: '1.1rem' }}
      >
        Get started
      </Button>
    </Box>
  )
}
