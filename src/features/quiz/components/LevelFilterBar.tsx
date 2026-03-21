/**
 * LevelFilterBar - compact CEFR level filter shown on the quiz mode selector.
 *
 * Renders a row of small toggle chips for each level that has words.
 * Changes are session-only — they are passed up to the parent but never
 * written to UserSettings / StorageService.
 */

import { Box, Chip, Stack, Typography } from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
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
      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
      aria-label="Session level filter"
    >
      <FilterListIcon
        fontSize="small"
        sx={{ color: 'text.secondary', mt: 0.25, flexShrink: 0 }}
        aria-hidden="true"
      />
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {availableLevels.map((level) => {
            const count = wordCountByLevel[level]
            const isSelected = sessionLevels.includes(level)

            return (
              <Chip
                key={level}
                label={`${level} (${count})`}
                size="small"
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                onClick={() => handleToggle(level)}
                aria-pressed={isSelected}
                aria-label={`${level} — ${count} words${isSelected ? ', selected' : ''}`}
                sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
              />
            )
          })}
        </Stack>

        {allSelected ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            All levels (session only)
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Session override — won&apos;t be saved
          </Typography>
        )}
      </Box>
    </Box>
  )
}
