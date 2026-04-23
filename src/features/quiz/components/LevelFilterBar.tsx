/**
 * LevelFilterBar - compact CEFR level filter shown on the quiz mode selector.
 *
 * Renders a row of pill-shaped toggles for each level that has words.
 * Changes are session-only — they are passed up to the parent but never
 * written to UserSettings / StorageService.
 *
 * Liquid Glass pill pattern (issue #148, derived from §Library filter pills):
 *   - Active pill:   solid `ink` background, `bg` text
 *   - Inactive pill: <Glass> inline with `inkSec` text
 *
 * The pill logic is intentionally local to this component — do NOT extract a
 * new <FilterPill> atom here. If issue #149 (Library) promotes a shared pill,
 * that refactor happens there.
 */

import { Box, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Filter } from 'lucide-react'
import { Glass } from '@/components/primitives/Glass'
import { getGlassTokens, glassTypography, glassRadius, glassShadows } from '@/theme/liquidGlass'
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

            return isActive ? (
              /* Active pill: solid ink background, bg text */
              <Box
                key={level}
                component="button"
                type="button"
                onClick={() => handleToggle(level)}
                aria-pressed={true}
                aria-label={`${level} — ${count} words, selected`}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '28px',
                  px: '10px',
                  borderRadius: `${glassRadius.pill}px`,
                  backgroundColor: tokens.color.ink,
                  color: tokens.color.bg,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: glassShadows.filterActive,
                  fontFamily: glassTypography.body,
                  fontSize: '12px',
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.1px',
                  transition: 'opacity 150ms ease, transform 150ms ease',
                  '&:active': { opacity: 0.8, transform: 'scale(0.95)' },
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                    '&:active': { transform: 'none' },
                  },
                }}
              >
                {level} ({count})
              </Box>
            ) : (
              /* Inactive pill: Glass inline with inkSec text */
              <Box
                key={level}
                sx={{ position: 'relative', display: 'inline-flex', height: '28px' }}
              >
                <Glass radius={glassRadius.pill} pad={0} floating={false} sx={{ height: '28px' }}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => handleToggle(level)}
                    aria-pressed={false}
                    aria-label={`${level} — ${count} words`}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '28px',
                      px: '10px',
                      backgroundColor: 'transparent',
                      color: tokens.color.inkSec,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: glassTypography.body,
                      fontSize: '12px',
                      fontWeight: 500,
                      lineHeight: 1,
                      letterSpacing: '-0.1px',
                      borderRadius: `${glassRadius.pill}px`,
                      transition: 'opacity 150ms ease, transform 150ms ease',
                      '&:active': { opacity: 0.8, transform: 'scale(0.95)' },
                      '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                        '&:active': { transform: 'none' },
                      },
                    }}
                  >
                    {level} ({count})
                  </Box>
                </Glass>
              </Box>
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
