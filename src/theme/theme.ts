import { createTheme, type Theme } from '@mui/material/styles'
import type { ThemePreference } from '@/types'
import { getGlassTokens, glassRadius, glassTypography, glassShadows } from './liquidGlass'

/**
 * Build MUI typography config from Liquid Glass typography tokens.
 * Display font (SF Pro Display / Inter) for headings; body font (SF Pro Text / Inter) for body.
 * Typography tokens are shared between light and dark variants.
 */
function buildTypography() {
  return {
    fontFamily: glassTypography.body,
    h1: {
      fontFamily: glassTypography.display,
      fontWeight: glassTypography.roles.largeTitle.weight,
      fontSize: `${glassTypography.roles.largeTitle.size}px`,
      letterSpacing: `${glassTypography.roles.largeTitle.tracking}px`,
      lineHeight: glassTypography.roles.largeTitle.lineHeight,
    },
    h2: {
      fontFamily: glassTypography.display,
      fontWeight: glassTypography.roles.title.weight,
      fontSize: `${glassTypography.roles.title.size}px`,
      letterSpacing: `${glassTypography.roles.title.tracking}px`,
      lineHeight: glassTypography.roles.title.lineHeight,
    },
    h3: {
      fontFamily: glassTypography.display,
      fontWeight: glassTypography.roles.title.weight,
      letterSpacing: `${glassTypography.roles.title.tracking}px`,
    },
    h4: {
      fontFamily: glassTypography.display,
      fontWeight: glassTypography.roles.title.weight,
      letterSpacing: `${glassTypography.roles.title.tracking}px`,
    },
    h5: {
      fontFamily: glassTypography.display,
      fontWeight: glassTypography.roles.title.weight,
    },
    h6: {
      fontFamily: glassTypography.display,
      fontWeight: glassTypography.roles.title.weight,
    },
    body1: {
      fontSize: `${glassTypography.roles.body.size}px`,
      fontWeight: glassTypography.roles.body.weight,
      letterSpacing: `${glassTypography.roles.body.tracking}px`,
      lineHeight: glassTypography.roles.body.lineHeight,
    },
    body2: {
      fontSize: `${glassTypography.roles.copy.size}px`,
      fontWeight: glassTypography.roles.copy.weight,
      letterSpacing: `${glassTypography.roles.copy.tracking}px`,
      lineHeight: glassTypography.roles.copy.lineHeight,
    },
    button: {
      fontFamily: glassTypography.body,
      fontWeight: glassTypography.roles.button.weight,
      fontSize: `${glassTypography.roles.button.size}px`,
      letterSpacing: `${glassTypography.roles.button.tracking}px`,
      textTransform: 'none' as const,
    },
    caption: {
      fontSize: `${glassTypography.roles.caption.size}px`,
      fontWeight: glassTypography.roles.caption.weight,
      letterSpacing: `${glassTypography.roles.caption.tracking}px`,
      lineHeight: glassTypography.roles.caption.lineHeight,
    },
    subtitle1: { fontWeight: glassTypography.roles.body.weight },
    subtitle2: { fontWeight: glassTypography.roles.copy.weight },
  }
}

function buildComponents(tokens: ReturnType<typeof getGlassTokens>) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: glassRadius.btn,
          minHeight: 44,
          fontWeight: glassTypography.roles.button.weight,
          fontSize: `${glassTypography.roles.button.size}px`,
          letterSpacing: `${glassTypography.roles.button.tracking}px`,
          textTransform: 'none' as const,
          // Enter/exit use opacity/transform only — no animating on blurred surfaces.
          transition: 'opacity 200ms ease, transform 200ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          backgroundColor: tokens.color.accent,
          color: '#ffffff',
          boxShadow: glassShadows.accentBtn,
          '&:hover': {
            backgroundColor: tokens.color.accent,
            boxShadow: glassShadows.accentBtn,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: glassRadius.card,
          backgroundImage: 'none',
          transition: 'opacity 200ms ease, transform 200ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: glassRadius.card,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: glassRadius.inline,
            transition: 'box-shadow 150ms ease',
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${tokens.color.accentSoft}`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: glassRadius.inline,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: glassRadius.pill,
          fontWeight: glassTypography.roles.micro.weight,
          fontSize: `${glassTypography.roles.micro.size}px`,
          letterSpacing: `${glassTypography.roles.micro.tracking}px`,
          height: 26,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        html {
          scroll-behavior: smooth;
        }
        body {
          /* Ensure content does not overlap the iOS notch or home indicator.
             env() variables are set when viewport-fit=cover is present in the
             viewport meta tag. They fall back to 0 on non-notched devices. */
          padding-top: env(safe-area-inset-top);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
          /* Bottom padding is handled per-component (e.g. BottomNav) so that
             backgrounds can extend to the physical edge while content stays clear. */
        }
      `,
    },
  }
}

export function createAppTheme(mode: 'light' | 'dark'): Theme {
  const tokens = getGlassTokens(mode)

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.color.accent,
        light: tokens.color.accentSoft,
        dark: tokens.color.accentText,
        contrastText: '#ffffff',
      },
      secondary: {
        main: tokens.color.violet,
        contrastText: '#ffffff',
      },
      success: {
        main: tokens.color.ok,
        contrastText: '#ffffff',
      },
      error: {
        main: tokens.color.red,
        contrastText: '#ffffff',
      },
      warning: {
        main: tokens.color.warn,
        contrastText: '#ffffff',
      },
      background: {
        default: tokens.color.bg,
        paper: tokens.color.bg,
      },
      text: {
        primary: tokens.color.ink,
        secondary: tokens.color.inkSec,
        disabled: tokens.color.inkFaint,
      },
      divider: tokens.color.rule2,
    },
    typography: buildTypography(),
    shape: {
      borderRadius: glassRadius.card,
    },
    components: buildComponents(tokens),
  })
}

/**
 * Resolve a ThemePreference to a concrete 'light' | 'dark' mode,
 * consulting the system media query when preference is 'system'.
 */
export function resolveThemeMode(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

// Default dark theme exported for backward compatibility during migration.
export const theme = createAppTheme('dark')
