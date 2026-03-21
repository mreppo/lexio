/**
 * CefrLevelSelector - multi-select toggle chip row for CEFR levels.
 *
 * Displays all six levels (A1–C2). Levels with zero words in the active pair
 * are greyed out but still selectable (user may install a pack later).
 * When nothing is selected a helper text clarifies that all levels are included.
 */

import { Box, Chip, Stack, Typography } from '@mui/material'
import type { CefrLevel } from '@/types'
import { CEFR_LEVELS } from '@/types'

export interface CefrLevelSelectorProps {
  /** Currently selected levels. Empty means "all". */
  readonly selectedLevels: readonly CefrLevel[]
  /** Word count per level so we can grey out empty ones. */
  readonly wordCountByLevel: Readonly<Record<CefrLevel, number>>
  /** Called when the user toggles a level. */
  readonly onChange: (levels: readonly CefrLevel[]) => void
}

export function CefrLevelSelector({
  selectedLevels,
  wordCountByLevel,
  onChange,
}: CefrLevelSelectorProps) {
  const handleToggle = (level: CefrLevel): void => {
    const isSelected = selectedLevels.includes(level)
    const next = isSelected ? selectedLevels.filter((l) => l !== level) : [...selectedLevels, level]
    onChange(next)
  }

  const allSelected = selectedLevels.length === 0

  return (
    <Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        {CEFR_LEVELS.map((level) => {
          const count = wordCountByLevel[level]
          const isEmpty = count === 0
          const isSelected = selectedLevels.includes(level)

          return (
            <Chip
              key={level}
              label={`${level}${count > 0 ? ` (${count})` : ''}`}
              size="small"
              color={isSelected ? 'primary' : 'default'}
              variant={isSelected ? 'filled' : 'outlined'}
              onClick={() => handleToggle(level)}
              aria-pressed={isSelected}
              aria-label={`${level}${isEmpty ? ' — no words installed' : ` — ${count} words`}${isSelected ? ', selected' : ''}`}
              sx={{
                cursor: 'pointer',
                opacity: isEmpty ? 0.45 : 1,
                transition: 'opacity 0.15s',
              }}
            />
          )
        })}
      </Stack>

      {allSelected && (
        <Typography variant="caption" color="text.secondary">
          All levels included
        </Typography>
      )}
    </Box>
  )
}
