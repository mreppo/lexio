import { Box, Typography, Button, CircularProgress } from '@mui/material'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import BoltIcon from '@mui/icons-material/Bolt'

export interface WelcomeStepProps {
  readonly onDemo: () => void
  readonly onManualSetup: () => void
  /** True while the instant demo is being set up (pair + pack install). */
  readonly demoLoading?: boolean
}

/**
 * Combined Welcome step of the onboarding flow.
 * Offers two paths:
 *   - "Try it now" — instant demo with auto-created EN-LV pair and A1 pack
 *   - "Set up my own" — manual language pair creation (full 3-step flow)
 */
export function WelcomeStep({ onDemo, onManualSetup, demoLoading = false }: WelcomeStepProps) {
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

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          mt: 2,
          width: '100%',
          maxWidth: 320,
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={onDemo}
          disabled={demoLoading}
          startIcon={demoLoading ? <CircularProgress size={20} color="inherit" /> : <BoltIcon />}
          sx={{ px: 6, py: 1.5, borderRadius: 3, fontSize: '1.1rem', width: '100%' }}
        >
          {demoLoading ? 'Setting up…' : 'Try it now'}
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={onManualSetup}
          disabled={demoLoading}
          sx={{ px: 4, py: 1.5, borderRadius: 3, width: '100%' }}
        >
          Set up my own
        </Button>
      </Box>
    </Box>
  )
}
