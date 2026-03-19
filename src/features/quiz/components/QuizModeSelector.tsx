/**
 * QuizModeSelector - allows the user to pick a quiz mode before starting.
 *
 * Displays three mode cards: Type, Choice, and Mixed.
 * The selected mode is persisted to user settings via the provided callback.
 * This component is shown before the quiz begins (not during an active quiz).
 */

import { useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from '@mui/material'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import type { QuizMode } from '@/types'

// ─── Mode descriptors ─────────────────────────────────────────────────────────

interface ModeDescriptor {
  readonly mode: QuizMode
  readonly label: string
  readonly description: string
  readonly icon: React.ReactNode
}

const MODE_DESCRIPTORS: readonly ModeDescriptor[] = [
  {
    mode: 'type',
    label: 'Type',
    description: 'Type the translation yourself',
    icon: <KeyboardIcon />,
  },
  {
    mode: 'choice',
    label: 'Choice',
    description: 'Pick from four options',
    icon: <CheckBoxOutlinedIcon />,
  },
  {
    mode: 'mixed',
    label: 'Mixed',
    description: 'Alternates type and choice',
    icon: <ShuffleIcon />,
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuizModeSelectorProps {
  /** Currently selected mode. */
  readonly selectedMode: QuizMode
  /** Called whenever the user picks a different mode. */
  readonly onModeChange: (mode: QuizMode) => void
  /** Called when the user is ready to start the session. */
  readonly onStart: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuizModeSelector({
  selectedMode,
  onModeChange,
  onStart,
}: QuizModeSelectorProps) {
  const handleSelect = useCallback(
    (mode: QuizMode): void => {
      onModeChange(mode)
    },
    [onModeChange],
  )

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      role="region"
      aria-label="Quiz mode selection"
    >
      <Typography variant="h6" fontWeight={700} textAlign="center">
        Choose your quiz mode
      </Typography>

      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        role="radiogroup"
        aria-label="Quiz modes"
      >
        {MODE_DESCRIPTORS.map(({ mode, label, description, icon }) => {
          const isSelected = selectedMode === mode

          return (
            <Card
              key={mode}
              variant="outlined"
              sx={{
                borderColor: isSelected ? 'primary.main' : 'divider',
                borderWidth: isSelected ? 2 : 1,
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: isSelected ? 2 : 0,
              }}
            >
              <CardActionArea
                onClick={() => handleSelect(mode)}
                aria-pressed={isSelected}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${label} mode: ${description}`}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 2,
                  }}
                >
                  <Box
                    sx={{
                      color: isSelected ? 'primary.main' : 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 28,
                    }}
                    aria-hidden="true"
                  >
                    {icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={isSelected ? 700 : 500}
                      color={isSelected ? 'primary.main' : 'text.primary'}
                    >
                      {label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          )
        })}
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={onStart}
        aria-label={`Start ${selectedMode} mode quiz`}
      >
        Start quiz
      </Button>
    </Box>
  )
}
