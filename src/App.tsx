import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  CircularProgress,
} from '@mui/material'
import { createAppTheme } from './theme'
import { useThemeMode } from './hooks/useThemeMode'
import { LocalStorageService } from './services/storage'
import { StorageContext, useStorage } from './hooks/useStorage'
import { useLanguagePairs, LanguagePairSelector, CreatePairDialog } from './features/language-pairs'
import type { CreatePairInput } from './features/language-pairs'
import { WordListScreen } from './features/words'
import { QuizHub } from './features/quiz'
import { DashboardScreen, useDashboard } from './features/dashboard'
import { StatsScreen } from './features/stats'
import { SettingsScreen } from './features/settings'
import { OnboardingFlow } from './features/onboarding'
import { BottomNav } from './components'
import type { AppTab } from './components'
import type { LanguagePair, UserSettings } from './types'
import { Sentry } from './services/sentry'

/**
 * A single shared storage instance for the application.
 * Created outside of the component to avoid re-instantiation on every render.
 */
const storageService = new LocalStorageService()

/**
 * Inner app component that consumes the storage context.
 * Split from the outer App so context is available for all hooks.
 */
function AppContent() {
  const { preference: themePreference, mode, setPreference } = useThemeMode(storageService)
  const appTheme = useMemo(() => createAppTheme(mode), [mode])

  const { pairs, activePair, loading: pairsLoading, createPair, switchPair } = useLanguagePairs()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  /**
   * Whether the onboarding flow is active.
   * Set to true once loading completes and no pairs exist.
   * Set to false when the user completes the flow or when pairs are found.
   */
  const [showOnboarding, setShowOnboarding] = useState(false)
  // Active navigation tab.
  const [activeTab, setActiveTab] = useState<AppTab>('home')

  const storage = useStorage()
  const [settings, setSettings] = useState<UserSettings>({
    activePairId: null,
    quizMode: 'type',
    dailyGoal: 20,
    theme: 'system',
    typoTolerance: 1,
  })

  // Load settings on mount.
  useEffect(() => {
    void storage.getSettings().then((s) => setSettings(s))
  }, [storage])

  // Detect first launch: after pairs have loaded, show onboarding when none exist.
  useEffect(() => {
    if (!pairsLoading && pairs.length === 0) {
      setShowOnboarding(true)
    }
  }, [pairsLoading, pairs.length])

  const dashboardData = useDashboard(activePair?.id ?? null, settings.dailyGoal)

  // Word counts per pair for the Settings screen language-pairs section.
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({})
  // Track which pair IDs we have already fetched word counts for to avoid redundant fetches.
  const fetchedPairIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    const pairsToFetch = pairs.filter((p) => !fetchedPairIds.current.has(p.id))
    if (pairsToFetch.length === 0) return
    void Promise.all(
      pairsToFetch.map(async (pair) => {
        const words = await storage.getWords(pair.id)
        return { id: pair.id, count: words.length }
      }),
    ).then((results) => {
      setWordCounts((prev) => {
        const next = { ...prev }
        for (const { id, count } of results) {
          next[id] = count
          fetchedPairIds.current.add(id)
        }
        return next
      })
    })
  }, [pairs, storage])

  /**
   * Called by OnboardingFlow step 2 to create a language pair.
   * Returns the created LanguagePair so the flow can pass it to step 3.
   */
  const handleOnboardingCreatePair = useCallback(
    async (input: CreatePairInput): Promise<LanguagePair> => {
      return createPair(input, true)
    },
    [createPair],
  )

  /** Called when the user completes (or skips) the onboarding flow. */
  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false)
  }, [])

  const handleCreatePair = useCallback(
    async (input: CreatePairInput): Promise<void> => {
      await createPair(input, true)
    },
    [createPair],
  )

  const handleOpenCreateDialog = useCallback(() => {
    setCreateDialogOpen(true)
  }, [])

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false)
  }, [])

  /** Navigate to quiz tab (called from Dashboard quick-start button). */
  const handleStartQuizFromDashboard = useCallback(() => {
    setActiveTab('quiz')
  }, [])

  /** Handle settings change from QuizHub (quiz mode changes) and persist. */
  const handleSettingsChange = useCallback((updated: UserSettings): void => {
    setSettings(updated)
  }, [])

  /** Handle theme change from SettingsScreen. */
  const handleThemeChange = useCallback(
    (preference: UserSettings['theme']): void => {
      void setPreference(preference)
    },
    [setPreference],
  )

  // When returning to the home tab, refresh dashboard data.
  const handleTabChange = useCallback(
    (tab: AppTab): void => {
      setActiveTab(tab)
      if (tab === 'home') {
        dashboardData.refresh()
      }
    },
    [dashboardData],
  )

  const showNav = !pairsLoading && pairs.length > 0 && !showOnboarding

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />

      {/* Onboarding: full-screen wizard, no app bar or nav */}
      {!pairsLoading && showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onCreatePair={handleOnboardingCreatePair}
        />
      )}

      {/* Loading spinner while pairs are being fetched */}
      {pairsLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Main app shell — only shown after loading and when onboarding is complete */}
      {!pairsLoading && !showOnboarding && (
        <>
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar sx={{ gap: 2 }}>
              <Typography
                variant="h6"
                component="span"
                sx={{ fontWeight: 700, color: 'primary.main', flexShrink: 0 }}
              >
                Lexio
              </Typography>

              <Box sx={{ flex: 1 }} />

              <LanguagePairSelector
                pairs={pairs}
                activePair={activePair}
                loading={pairsLoading}
                onSwitch={switchPair}
                onAddPair={handleOpenCreateDialog}
              />
            </Toolbar>
          </AppBar>

          {/* Main content — bottom padding makes room for the fixed BottomNav */}
          <Container maxWidth="sm" sx={{ py: 3, pb: showNav ? '72px' : 3 }}>
            {activeTab === 'home' && (
              <DashboardScreen
                activePair={activePair}
                settings={settings}
                todayStats={dashboardData.todayStats}
                wordProgressList={dashboardData.wordProgressList}
                totalWords={dashboardData.totalWords}
                streakDays={dashboardData.streakDays}
                recentStats={dashboardData.recentStats}
                loading={dashboardData.loading}
                onStartQuiz={handleStartQuizFromDashboard}
              />
            )}

            {activeTab === 'quiz' && (
              <QuizHub
                pair={activePair}
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            )}

            {activeTab === 'words' && <WordListScreen activePair={activePair} />}

            {activeTab === 'stats' && <StatsScreen />}

            {activeTab === 'settings' && (
              <SettingsScreen
                themePreference={themePreference}
                onThemeChange={handleThemeChange}
                settings={settings}
                onSettingsChange={handleSettingsChange}
                pairs={pairs}
                wordCounts={wordCounts}
                onAddPair={handleOpenCreateDialog}
              />
            )}
          </Container>

          {/* Bottom navigation — only visible when there are language pairs */}
          {showNav && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}

          <CreatePairDialog
            open={createDialogOpen}
            onClose={handleCloseCreateDialog}
            onSubmit={handleCreatePair}
            suggestDefault={false}
          />
        </>
      )}
    </ThemeProvider>
  )
}

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

export default function App() {
  return (
    <StorageContext.Provider value={storageService}>
      <Sentry.ErrorBoundary fallback={ErrorFallback}>
        <AppContent />
      </Sentry.ErrorBoundary>
    </StorageContext.Provider>
  )
}
