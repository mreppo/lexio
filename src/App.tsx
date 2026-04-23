import { lazy, Suspense } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createAppTheme } from './theme'
import { LocalStorageService } from './services/storage'
import { StorageContext } from './hooks/useStorage'
import { LandingPage } from './features/landing'
import { Sentry } from './services/sentry'
import { BrandedLoader } from './components/BrandedLoader'
import { useAnalytics } from './hooks/useAnalytics'

/**
 * Dev-only: lazy-load the Glass demo page so it is never included in the
 * production bundle. The import() is inside the DEV guard so the module
 * reference itself is dead code in production builds (tree-shaken by Vite).
 */
const LazyGlassDemo = import.meta.env.DEV
  ? lazy(() => import('./features/glass-demo/GlassDemo').then((m) => ({ default: m.GlassDemo })))
  : null

/**
 * A single shared storage instance for the entire application.
 * Created here (entry point) so both the landing page and the lazy-loaded
 * app shell share the same instance via StorageContext.
 */
const storageService = new LocalStorageService()

/**
 * Lazy-loaded app shell so the main app bundle is not downloaded when
 * a visitor views only the landing page.
 */
const LazyAppShell = lazy(() => import('./AppContent'))

/**
 * Fallback UI rendered when a React render crash is caught by the ErrorBoundary.
 * Shows a user-friendly message and a button to retry.
 */
function ErrorFallback({
  resetError,
}: {
  error: unknown
  resetError: () => void
  componentStack: string
  eventId: string
}): React.JSX.Element {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Typography variant="h5" gutterBottom>
        Something went wrong
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The error has been reported. Please try refreshing the page.
      </Typography>
      <Button variant="contained" onClick={resetError}>
        Try again
      </Button>
    </Box>
  )
}

/**
 * Dark theme singleton for the landing page.
 * Created once outside the component to avoid unnecessary re-creation on renders.
 */
const landingDarkTheme = createAppTheme('dark')

/**
 * Theme wrapper for the landing page route.
 * The landing page always uses dark mode for consistent visual presentation.
 */
function LandingThemeWrapper(): React.JSX.Element {
  return (
    <ThemeProvider theme={landingDarkTheme}>
      <CssBaseline />
      <LandingPage />
    </ThemeProvider>
  )
}

/**
 * Inner component mounted inside HashRouter so that useAnalytics can
 * access window.location.hash after the router initialises.
 */
function AnalyticsTracker(): null {
  useAnalytics()
  return null
}

export default function App() {
  return (
    <StorageContext.Provider value={storageService}>
      <Sentry.ErrorBoundary fallback={ErrorFallback}>
        <HashRouter>
          <AnalyticsTracker />
          <Routes>
            {/* Landing page — shown at the root hash route */}
            <Route path="/" element={<LandingThemeWrapper />} />

            {/* Main app — lazy-loaded so the bundle is not fetched on landing page visits */}
            <Route
              path="/app"
              element={
                <Suspense
                  fallback={
                    <ThemeProvider theme={landingDarkTheme}>
                      <CssBaseline />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: '100vh',
                        }}
                      >
                        <BrandedLoader label="Loading Lexio" showWordmark />
                      </Box>
                    </ThemeProvider>
                  }
                >
                  <LazyAppShell />
                </Suspense>
              }
            />

            {/* Dev-only Glass demo route — tree-shaken out of production builds */}
            {import.meta.env.DEV && LazyGlassDemo && (
              <Route
                path="/__glass-demo"
                element={
                  <Suspense fallback={<Box sx={{ p: 4, color: '#fff' }}>Loading demo…</Box>}>
                    <LazyGlassDemo />
                  </Suspense>
                }
              />
            )}

            {/* Redirect any unknown route to the landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </Sentry.ErrorBoundary>
    </StorageContext.Provider>
  )
}
