import { createTheme, type Theme } from '@mui/material/styles'
import type { ThemePreference } from '@/types'

/**
 * Palette tokens shared between both modes.
 * Defined here so component overrides can reference them without
 * needing the full theme object (avoids circular dependency).
 */
const PALETTE = {
  primary: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#0a0f1a',
  },
  secondary: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#1d4ed8',
    contrastText: '#ffffff',
  },
  success: {
    main: '#22c55e',
    light: '#4ade80',
    dark: '#16a34a',
    contrastText: '#ffffff',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    contrastText: '#ffffff',
  },
} as const

/**
 * Typography using Nunito (body – clean, high readability, full Latvian diacritics support)
 * and Sora (display/headings – modern geometric with character).
 * Both fonts are loaded via index.html Google Fonts link tag.
 */
const FONT_DISPLAY = '"Sora", "Nunito", sans-serif'
const FONT_BODY = '"Nunito", "Sora", sans-serif'

function buildTypography() {
  return {
    fontFamily: FONT_BODY,
    h1: { fontFamily: FONT_DISPLAY, fontWeight: 700 },
    h2: { fontFamily: FONT_DISPLAY, fontWeight: 700 },
    h3: { fontFamily: FONT_DISPLAY, fontWeight: 600 },
    h4: { fontFamily: FONT_DISPLAY, fontWeight: 600 },
    h5: { fontFamily: FONT_DISPLAY, fontWeight: 600 },
    h6: { fontFamily: FONT_DISPLAY, fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: { fontFamily: FONT_BODY, fontWeight: 700, textTransform: 'none' as const },
  }
}

function buildComponents() {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 44,
          fontWeight: 700,
          textTransform: 'none' as const,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
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
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.15s ease',
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px rgba(245, 158, 11, 0.25)`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
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
      `,
    },
  }
}

export function createAppTheme(mode: 'light' | 'dark'): Theme {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      ...PALETTE,
      background: {
        default: isDark ? '#0a0f1a' : '#fafaf9',
        paper: isDark ? '#111827' : '#f5f5f4',
      },
      text: {
        primary: isDark ? '#f9fafb' : '#111827',
        secondary: isDark ? '#9ca3af' : '#6b7280',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    },
    typography: buildTypography(),
    shape: {
      borderRadius: 12,
    },
    components: buildComponents(),
  })
}

/**
 * Resolve a ThemePreference to a concrete 'light' | 'dark' mode,
 * consulting the system media query when preference is 'system'.
 */
export function resolveThemeMode(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

// Default dark theme exported for backward compatibility during migration.
export const theme = createAppTheme('dark')
