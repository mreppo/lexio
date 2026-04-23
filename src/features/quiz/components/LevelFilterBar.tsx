/**
 * LevelFilterBar - compact CEFR level filter shown on the quiz mode selector.
 *
 * Renders a row of pill-shaped toggles for each level that has words.
 * Changes are session-only — they are passed up to the parent but never
 * written to UserSettings / StorageService.
 *
 * Liquid Glass pill pattern (issue #148). Refactored in issue #149 to use the
 * shared <FilterPill> atom extracted from this component's local implementation.
 *
 * Multi-select semantics: tapping a pill toggles it independently (unlike the
 * Library filter pills which are mutually exclusive). The parent owns this
 * selection logic and passes sessionLevels down.
 */

import { Box, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Filter } from 'lucide-react'
import { FilterPill } from '@/components/atoms/FilterPill'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import type { CefrLevel } from '@/types'
import { CEFR_LEVELS } from '@/types'

export interface LevelFilterBarProps {
  /** Session-level selected levels. Empty means "all". */
  readonly sessionLevels: readonly CefrLevel[]
  /** Word count per level so we can hide or grey out empty levels. */
  readonly wordCountByLevel: Readonly<Record<CefrLevel, number>>
  /** Called when the user toggles a level chip. */
  readonly onChange: (levels: readonly CefrLevel[]) => void
}

export function LevelFilterBar({ sessionLevels, wordCountByLevel, onChange }: LevelFilterBarProps) {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const handleToggle = (level: CefrLevel): void => {
    const isSelected = sessionLevels.includes(level)
    const next = isSelected ? sessionLevels.filter((l) => l !== level) : [...sessionLevels, level]
    onChange(next)
  }

  // Only show levels that have at least one word to keep the UI clean.
  const availableLevels = CEFR_LEVELS.filter((l) => wordCountByLevel[l] > 0)

  // If no levels have any words, don't render the bar.
  if (availableLevels.length === 0) return null

  const allSelected = sessionLevels.length === 0

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
      aria-label="Session level filter"
    >
      <Filter
        size={16}
        color={tokens.color.inkSec}
        strokeWidth={2}
        aria-hidden
        style={{ marginTop: '6px', flexShrink: 0 }}
      />
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {availableLevels.map((level) => {
            const count = wordCountByLevel[level]
            const isActive = sessionLevels.includes(level)

            return (
              <FilterPill
                key={level}
                active={isActive}
                onClick={() => handleToggle(level)}
                aria-label={
                  isActive ? `${level} — ${count} words, selected` : `${level} — ${count} words`
                }
              >
                {level} ({count})
              </FilterPill>
            )
          })}
        </Stack>

        {allSelected ? (
          <Box
            component="span"
            sx={{
              display: 'block',
              mt: '4px',
              fontFamily: glassTypography.body,
              fontSize: '12px',
              fontWeight: 500,
              color: tokens.color.inkSec,
            }}
          >
            All levels (session only)
          </Box>
        ) : (
          <Box
            component="span"
            sx={{
              display: 'block',
              mt: '4px',
              fontFamily: glassTypography.body,
              fontSize: '12px',
              fontWeight: 500,
              color: tokens.color.inkSec,
            }}
          >
            Session override — won&apos;t be saved
          </Box>
        )}
      </Box>
    </Box>
  )
}
