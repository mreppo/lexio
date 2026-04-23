/**
 * QuizModeSelector - Liquid Glass mode cards for picking a quiz mode.
 *
 * Redesigned for issue #148 using the Liquid Glass design system.
 *
 * Two mode cards (Typing + Multiple Choice) are stacked vertically.
 * Each card uses <Glass pad=18 floating strong> with:
 *   - An accent icon square (GlassIcon with accent-colored icon)
 *   - Title: 17/700 ink
 *   - Helper text: 13/500 inkSec
 *   - Chevron-right trailing
 *
 * Tapping a card immediately starts a session in that mode (single tap →
 * onModeChange + onStart) so the mode selector acts as a launcher, not a
 * separate selection + confirm flow.
 *
 * The "Mixed" mode is intentionally excluded from the two-card layout per
 * issue #148 AC (two cards: Typing + Multiple Choice).
 *
 * Empty state: when dueCount === 0, mode cards are hidden and replaced with
 * a celebratory message + "Browse library" glass CTA (wired via onBrowseLibrary).
 */

import { useCallback } from 'react'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ChevronRight } from 'lucide-react'
import type { QuizMode, CefrLevel } from '@/types'
import { Glass } from '@/components/primitives/Glass'
import { GlassIcon } from '@/components/atoms/GlassIcon'
import { IconGlyph } from '@/components/atoms/IconGlyph'
import { Btn } from '@/components/atoms/Btn'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import { DailyProgressCard } from './DailyProgressCard'
import { LevelFilterBar } from './LevelFilterBar'

// ─── Mode descriptors ─────────────────────────────────────────────────────────

type SupportedMode = Extract<QuizMode, 'type' | 'choice'>

interface ModeDescriptor {
  readonly mode: SupportedMode
  readonly label: string
  readonly helperText: string
  readonly iconName: 'pencil' | 'checkSquare'
}

const MODE_DESCRIPTORS: readonly ModeDescriptor[] = [
  {
    mode: 'type',
    label: 'Typing',
    helperText: 'Type the translation yourself',
    iconName: 'pencil',
  },
  {
    mode: 'choice',
    label: 'Multiple Choice',
    helperText: 'Pick from four options',
    iconName: 'checkSquare',
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuizModeSelectorProps {
  /** Currently selected mode (used for default when mixed is passed down). */
  readonly selectedMode: QuizMode
  /** Called whenever the user picks a mode card (immediately starts session). */
  readonly onModeChange: (mode: QuizMode) => void
  /** Called when the user taps a mode card to start the session. */
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
  /**
   * Number of words due right now. When 0, the mode cards are replaced by
   * an empty-state celebratory message + Browse library CTA.
   */
  readonly dueCount: number
  /**
   * Called when the user taps "Browse library" in the empty state.
   * Should switch the active tab to 'words'.
   */
  readonly onBrowseLibrary: () => void
}

// ─── Mode card ────────────────────────────────────────────────────────────────

interface ModeCardProps {
  readonly descriptor: ModeDescriptor
  readonly onTap: (mode: SupportedMode) => void
}

function ModeCard({ descriptor, onTap }: ModeCardProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onTap(descriptor.mode)}
      aria-label={`${descriptor.label}: ${descriptor.helperText}`}
      sx={{
        width: '100%',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'block',
        textAlign: 'left',
        // Only animate opacity/transform — never backdrop-filter or background
        transition: 'opacity 150ms ease, transform 150ms ease',
        '&:active': { opacity: 0.85, transform: 'scale(0.98)' },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:active': { transform: 'none' },
        },
      }}
    >
      <Glass pad={18} floating strong>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Icon square — accent colored */}
          <GlassIcon as="div" size={44} aria-label="">
            <IconGlyph
              name={descriptor.iconName}
              size={20}
              color={tokens.color.accent}
              decorative
            />
          </GlassIcon>

          {/* Text block */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              component="span"
              sx={{
                display: 'block',
                fontFamily: glassTypography.body,
                fontSize: '17px',
                fontWeight: 700,
                lineHeight: 1.2,
                color: tokens.color.ink,
                letterSpacing: '-0.3px',
              }}
            >
              {descriptor.label}
            </Box>
            <Box
              component="span"
              sx={{
                display: 'block',
                fontFamily: glassTypography.body,
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: 1.3,
                color: tokens.color.inkSec,
                letterSpacing: '-0.1px',
                mt: '2px',
              }}
            >
              {descriptor.helperText}
            </Box>
          </Box>

          {/* Chevron-right trailing */}
          <ChevronRight
            size={18}
            color={tokens.color.inkFaint}
            strokeWidth={2}
            aria-hidden
            style={{ flexShrink: 0 }}
          />
        </Box>
      </Glass>
    </Box>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  readonly onBrowseLibrary: () => void
}

function EmptyState({ onBrowseLibrary }: EmptyStateProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Glass pad={22} floating strong sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {/* Celebratory icon */}
        <Box
          component="span"
          sx={{ fontSize: '42px', lineHeight: 1 }}
          role="img"
          aria-label="All caught up"
        >
          🎉
        </Box>

        <Box
          component="p"
          sx={{
            margin: 0,
            fontFamily: glassTypography.body,
            fontSize: '17px',
            fontWeight: 700,
            lineHeight: 1.2,
            color: tokens.color.ink,
            letterSpacing: '-0.3px',
          }}
        >
          All caught up!
        </Box>

        <Box
          component="p"
          sx={{
            margin: 0,
            fontFamily: glassTypography.body,
            fontSize: '15px',
            fontWeight: 500,
            lineHeight: 1.5,
            color: tokens.color.inkSec,
          }}
        >
          No words are due right now. Come back later or explore your library to add more words.
        </Box>

        <Box sx={{ mt: '4px', width: '100%' }}>
          <Btn kind="glass" size="md" full onClick={onBrowseLibrary}>
            Browse library
          </Btn>
        </Box>
      </Box>
    </Glass>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuizModeSelector({
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
  dueCount,
  onBrowseLibrary,
}: QuizModeSelectorProps) {
  const handleCardTap = useCallback(
    (mode: SupportedMode): void => {
      onModeChange(mode)
      onStart()
    },
    [onModeChange, onStart],
  )

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      role="region"
      aria-label="Quiz mode selection"
    >
      {/* Daily progress mini-card */}
      <DailyProgressCard
        wordsReviewedToday={wordsReviewedToday}
        dailyGoal={dailyGoal}
        streakDays={streakDays}
        wordsLearned={wordsLearned}
        totalWords={totalWords}
      />

      {dueCount === 0 ? (
        /* Empty state: no words due */
        <EmptyState onBrowseLibrary={onBrowseLibrary} />
      ) : (
        <>
          {/* Two mode cards stacked */}
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            role="list"
            aria-label="Quiz modes"
          >
            {MODE_DESCRIPTORS.map((descriptor) => (
              <Box key={descriptor.mode} role="listitem">
                <ModeCard descriptor={descriptor} onTap={handleCardTap} />
              </Box>
            ))}
          </Box>

          {/* Level filter bar */}
          <Box sx={{ mt: '4px' }}>
            <LevelFilterBar
              sessionLevels={sessionLevels}
              wordCountByLevel={wordCountByLevel}
              onChange={onSessionLevelsChange}
            />
          </Box>
        </>
      )}
    </Box>
  )
}
