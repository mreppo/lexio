/**
 * QuizModeSelector - allows the user to pick a quiz mode before starting.
 *
 * Displays three mode cards: Type, Choice, and Mixed.
 * The selected mode is persisted to user settings via the provided callback.
 * This component is shown before the quiz begins (not during an active quiz).
 */

import { useCallback } from 'react'
import { Box, Button, Typography } from '@mui/material'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import type { QuizMode, CefrLevel } from '@/types'
import { DailyProgressCard } from './DailyProgressCard'
import { LevelFilterBar } from './LevelFilterBar'

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
  /** Words already reviewed today (across all previous sessions). */
  readonly wordsReviewedToday: number
  /** Daily goal target. */
  readonly dailyGoal: number
  /** Current daily streak in days. */
  readonly streakDays: number
  /** Words whose confidence >= learned threshold in the active pair. */
  readonly wordsLearned: number
  /** Total words in the active pair. */
  readonly totalWords: number
  /** Session-only level override (not persisted to settings). Empty = all levels. */
  readonly sessionLevels: readonly CefrLevel[]
  /** Word count per level for displaying counts in the level filter bar. */
  readonly wordCountByLevel: Readonly<Record<CefrLevel, number>>
  /** Called when the user changes the session-level filter. */
  readonly onSessionLevelsChange: (levels: readonly CefrLevel[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuizModeSelector({
  selectedMode,
  onModeChange,
  onStart,
  wordsReviewedToday,
  dailyGoal,
  streakDays,
  wordsLearned,
  totalWords,
  sessionLevels,
  wordCountByLevel,
  onSessionLevelsChange,
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
      <DailyProgressCard
        wordsReviewedToday={wordsReviewedToday}
        dailyGoal={dailyGoal}
        streakDays={streakDays}
        wordsLearned={wordsLearned}
        totalWords={totalWords}
      />

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
            <Box
              key={mode}
              onClick={() => handleSelect(mode)}
              role="radio"
              aria-checked={isSelected}
              aria-pressed={isSelected}
              aria-label={`${label} mode: ${description}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: isSelected
                  ? 'rgba(245,158,11,0.12)'
                  : (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                borderLeft: isSelected ? '3px solid' : '3px solid transparent',
                borderColor: isSelected ? 'primary.main' : 'transparent',
                boxShadow: isSelected ? 1 : 0,
                transition: 'background-color 0.15s, box-shadow 0.15s',
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
            </Box>
          )
        })}
      </Box>

      <LevelFilterBar
        sessionLevels={sessionLevels}
        wordCountByLevel={wordCountByLevel}
        onChange={onSessionLevelsChange}
      />

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
