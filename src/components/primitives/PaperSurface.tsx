/**
 * PaperSurface — full-bleed screen root component.
 *
 * Every screen in Lexio is wrapped in PaperSurface. It:
 *   - Fills the entire viewport (min-height: 100dvh, width: 100%)
 *   - Renders the wallpaper gradient from Liquid Glass tokens as the background
 *   - Sets the text color to the ink token
 *   - Clips overflow (so glass cards don't leak outside the screen bounds)
 *
 * The wallpaper is 4 stacked CSS radial/linear gradients from tokens.json,
 * applied verbatim — this is the "vivid backdrop" that the glass surfaces
 * need to refract through.
 */

import { Box, type SxProps, type Theme } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens } from '../../theme/liquidGlass'

export interface PaperSurfaceProps {
  readonly children?: React.ReactNode
  readonly sx?: SxProps<Theme>
}

export function PaperSurface({ children, sx }: PaperSurfaceProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        // Wallpaper: 4 stacked gradients verbatim from tokens.json
        background: tokens.wallpaper,
        // Fallback solid color if gradients cannot render
        backgroundColor: tokens.color.bg,
        color: tokens.color.ink,
        overflow: 'hidden',
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}
