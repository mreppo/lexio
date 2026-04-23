/**
 * GlassDemo — dev-only visual test page for the Liquid Glass primitives.
 *
 * Accessible at /#/__glass-demo in development builds only.
 * This file is tree-shaken out of production bundles because every code path
 * is gated via the `import.meta.env.DEV` check in App.tsx where the route is
 * registered. If App.tsx imports this lazily (React.lazy), it is only fetched
 * when the route is visited.
 *
 * Grid: light × dark  ×  default / strong / floating  ×  all radius presets
 */

import { useState } from 'react'
import { Box, Typography, Switch, FormControlLabel } from '@mui/material'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createAppTheme } from '../../theme'
import { Glass } from '../../components/primitives/Glass'
import { PaperSurface } from '../../components/primitives/PaperSurface'
import { glassRadius } from '../../theme/liquidGlass'

const RADIUS_PRESETS = [
  { label: 'card (22)', value: 'card' },
  { label: 'btn (18)', value: 'btn' },
  { label: 'glass (28)', value: 'glass' },
  { label: 'pill (999)', value: 'pill' },
  { label: 'custom: 0', value: 0 },
  { label: 'custom: 8', value: 8 },
  { label: 'custom: 40', value: 40 },
] as const

type RadiusValue = (typeof RADIUS_PRESETS)[number]['value']

function GlassDemoSection({ mode }: { readonly mode: 'light' | 'dark' }) {
  const theme = createAppTheme(mode)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PaperSurface
        sx={{
          minHeight: 'auto',
          p: 3,
          borderRadius: 2,
          overflow: 'visible',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 800,
            color: mode === 'dark' ? '#fff' : '#111114',
          }}
        >
          {mode === 'light' ? 'Liquid Glass — Light' : 'Liquid Glass Dark'}
        </Typography>

        {/* default vs strong */}
        <Typography variant="body2" sx={{ mb: 1, opacity: 0.6 }}>
          Default vs Strong
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Glass sx={{ flex: '1 1 200px' }}>
            <Typography variant="body1">Default glass</Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              glassBg fill
            </Typography>
          </Glass>
          <Glass strong sx={{ flex: '1 1 200px' }}>
            <Typography variant="body1">Strong glass</Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              glassBgStrong fill
            </Typography>
          </Glass>
        </Box>

        {/* floating */}
        <Typography variant="body2" sx={{ mb: 1, opacity: 0.6 }}>
          Floating (outer shadow)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Glass floating sx={{ flex: '1 1 200px' }}>
            <Typography variant="body1">Floating</Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              glassShadow outer drop
            </Typography>
          </Glass>
          <Glass strong floating sx={{ flex: '1 1 200px' }}>
            <Typography variant="body1">Strong + Floating</Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              Combined variant
            </Typography>
          </Glass>
        </Box>

        {/* all radius presets */}
        <Typography variant="body2" sx={{ mb: 1, opacity: 0.6 }}>
          Radius presets
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {RADIUS_PRESETS.map((preset) => (
            <Glass
              key={String(preset.value)}
              radius={preset.value as RadiusValue}
              floating
              sx={{ flex: '1 1 140px', minWidth: 120 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {preset.label}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                {typeof preset.value === 'number'
                  ? `${preset.value}px`
                  : `${glassRadius[preset.value as keyof typeof glassRadius]}px`}
              </Typography>
            </Glass>
          ))}
        </Box>
      </PaperSurface>
    </ThemeProvider>
  )
}

export function GlassDemo(): React.JSX.Element {
  const [showDark, setShowDark] = useState(true)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#1a1a2e',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, flexGrow: 1 }}>
          Glass Demo — /__glass-demo (DEV ONLY)
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showDark}
              onChange={(e) => setShowDark(e.target.checked)}
              sx={{ '& .MuiSwitch-track': { bgcolor: '#444' } }}
            />
          }
          label={<Typography sx={{ color: '#fff' }}>Dark</Typography>}
        />
      </Box>

      {/* Light mode section */}
      {!showDark && <GlassDemoSection mode="light" />}
      {/* Dark mode section */}
      {showDark && <GlassDemoSection mode="dark" />}

      {/* Both side by side when screen is wide enough */}
      <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <GlassDemoSection mode="light" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <GlassDemoSection mode="dark" />
        </Box>
      </Box>
    </Box>
  )
}
