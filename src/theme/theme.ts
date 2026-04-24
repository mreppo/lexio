import { createTheme, type Theme } from '@mui/material/styles'
import type { ThemePreference } from '@/types'
import { getGlassTokens, glassRadius, glassTypography, glassShadows } from './liquidGlass'

/**
 * Convert a px value to rem based on 16px root font-size.
 * This ensures MUI Typography variants respect the browser's base font-size
 * setting (Dynamic Type / user font scaling at 200% zoom). Visual sizes at
 * 100% zoom are unchanged — 17px → 1.0625rem looks identical at 100%.
 */
function pxToRem(px: number): string {
  return `${px / 16}rem`
}

/**
 * Build MUI typography config from Liquid Glass typography tokens.
 * Display font (SF Pro Display / Inter) for headings; body font (SF Pro Text / Inter) for body.
 * Typography tokens are shared between light and dark variants.
 *
 * Font sizes use rem (not px) so they scale with the user's browser font-size
 * preference. Visual sizes at 100% browser zoom are identical to the px values.
 */
function buildTypography() {
  return {
    fontFamily: glassTypography.body,
    h1: {
      fontFamily: glassTypography.display,
      fontWeight: glassTypography.roles.largeTitle.weight,
      fontSize: pxToRem(glassTypography.roles.largeTitle.size),
      letterSpacing: `${glassTypography.roles.largeTitle.tracking}px`,
      lineHeight: glassTypography.roles.largeTitle.lineHeight,
    },
    h2: {
      fontFamily: glassTypography.display,
      fontWeight: glassTypography.roles.title.weight,
      fontSize: pxToRem(glassTypography.roles.title.size),
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
      fontSize: pxToRem(glassTypography.roles.body.size),
      fontWeight: glassTypography.roles.body.weight,
      letterSpacing: `${glassTypography.roles.body.tracking}px`,
      lineHeight: glassTypography.roles.body.lineHeight,
    },
    body2: {
      fontSize: pxToRem(glassTypography.roles.copy.size),
      fontWeight: glassTypography.roles.copy.weight,
      letterSpacing: `${glassTypography.roles.copy.tracking}px`,
      lineHeight: glassTypography.roles.copy.lineHeight,
    },
    button: {
      fontFamily: glassTypography.body,
      fontWeight: glassTypography.roles.button.weight,
      fontSize: pxToRem(glassTypography.roles.button.size),
      letterSpacing: `${glassTypography.roles.button.tracking}px`,
      textTransform: 'none' as const,
    },
    caption: {
      fontSize: pxToRem(glassTypography.roles.caption.size),
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
          fontSize: pxToRem(glassTypography.roles.button.size),
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
          fontSize: pxToRem(glassTypography.roles.micro.size),
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
        /*
         * Global focus-visible ring — 2px accent outline, 2px offset.
         * Applied to every interactive element via :focus-visible so keyboard
         * users always have a clear visual indicator. :focus-visible only fires
         * for keyboard navigation (not mouse clicks), so the ring does not
         * disrupt pointer-driven interaction.
         *
         * The accent color is injected at build time via the CSS custom property
         * set on :root in index.html, but since we're in a JS theme we use the
         * color token directly. The actual value is overridden per-mode in
         * createAppTheme via the --lexio-accent CSS variable set on <body>.
         * Fallback (#007AFF) matches the light-mode accent token.
         *
         * Do NOT override this with outline:none anywhere — it is a hard
         * accessibility requirement (WCAG 2.4.7 / 2.4.11).
         */
        *:focus-visible {
          outline: 2px solid var(--lexio-accent, #007AFF);
          outline-offset: 2px;
        }
        /* MUI's default focus-visible handling sometimes injects outline:0 on
           specific components. Restore it for button and anchor elements. */
        button:focus-visible,
        a:focus-visible,
        [role="button"]:focus-visible,
        [role="switch"]:focus-visible,
        [role="radio"]:focus-visible,
        [tabindex]:focus-visible {
          outline: 2px solid var(--lexio-accent, #007AFF) !important;
          outline-offset: 2px !important;
        }
      `,
    },
  }
}

/**
 * Inject the --lexio-accent CSS custom property onto <body> so the global
 * :focus-visible rule in MuiCssBaseline can use the mode-correct accent colour
 * without needing a JS dependency in the CSS string.
 *
 * Called by createAppTheme each time the mode changes. Safe to call on every
 * render because it only touches one CSS custom property on <body>.
 */
function setAccentCssVar(accent: string): void {
  if (typeof document !== 'undefined') {
    document.body.style.setProperty('--lexio-accent', accent)
  }
}

export function createAppTheme(mode: 'light' | 'dark'): Theme {
  const tokens = getGlassTokens(mode)
  setAccentCssVar(tokens.color.accent)

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
