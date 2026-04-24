import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { ThemeProvider, CssBaseline, Box } from '@mui/material'
import { createAppTheme } from './theme'
import { useThemeMode } from './hooks/useThemeMode'
import { useStorage } from './hooks/useStorage'
import { useLanguagePairs } from './features/language-pairs'
import type { CreatePairInput } from './features/language-pairs'
import { LibraryScreen } from './features/words/components/LibraryScreen'
import { QuizHub } from './features/quiz'
import { DashboardScreen, useDashboard } from './features/dashboard'
import { StatsScreen } from './features/stats'
import { SettingsScreen } from './features/settings'
import { OnboardingFlow } from './features/onboarding'
import { UpdateNotification, BrandedLoader, InstallBanner } from './components'
import { TabBar } from './components/composites'
import type { AppTab } from './components/composites'
import { useServiceWorker } from './hooks/useServiceWorker'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import type { LanguagePair, UserSettings } from './types'

/**
 * Inner app component that consumes the storage context.
 * The StorageContext is provided by the parent App component.
 */
function AppContent(): React.JSX.Element {
  const storage = useStorage()
  const { preference: themePreference, mode, setPreference } = useThemeMode(storage)
  const appTheme = useMemo(() => createAppTheme(mode), [mode])

  const { updateAvailable, applyUpdate, dismissUpdate } = useServiceWorker()
  const { showBanner, platform, triggerInstall, dismissBanner, recordQuizSession } =
    useInstallPrompt()

  const { pairs, activePair, loading: pairsLoading, createPair } = useLanguagePairs()

  /**
   * Whether the `?demo=true` query parameter is present in the URL.
   * Read once on mount via a ref so it's stable across renders.
   * When true, the OnboardingFlow will auto-trigger the instant demo path.
   *
   * With HashRouter the query string is encoded in the hash fragment
   * (e.g. #/app?demo=true), so we parse from window.location.hash rather
   * than window.location.search.
   */
  const autoDemoRef = useRef(
    (() => {
      // Extract everything after the first '?' in the hash fragment.
      const hash = window.location.hash // e.g. "#/app?demo=true"
      const qIndex = hash.indexOf('?')
      const hashSearch = qIndex >= 0 ? hash.slice(qIndex) : ''
      // Also check the regular search for direct navigation scenarios.
      const search = window.location.search || hashSearch
      return new URLSearchParams(search).get('demo') === 'true'
    })(),
  )

  /**
   * Whether the onboarding flow is active.
   * Set to true once loading completes and no pairs exist.
   * Set to false when the user completes the flow or when pairs are found.
   */
  const [showOnboarding, setShowOnboarding] = useState(false)
  // Active navigation tab.
  const [activeTab, setActiveTab] = useState<AppTab>('home')

  /**
   * When true, QuizHub will skip the mode-selection screen and auto-start using
   * the default quiz mode from settings. Consumed once per "Start review" press
   * from the Dashboard.
   */
  const [quizAutoStart, setQuizAutoStart] = useState(false)

  const [settings, setSettings] = useState<UserSettings>({
    activePairId: null,
    quizMode: 'type',
    dailyGoal: 20,
    theme: 'system',
    typoTolerance: 1,
    selectedLevels: [],
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
  const handleOnboardingComplete = useCallback((goToTab?: 'quiz') => {
    setShowOnboarding(false)
    if (goToTab) {
      setActiveTab(goToTab)
    }
  }, [])

  /** Navigate to quiz tab and auto-start (called from Dashboard "Start review" button). */
  const handleStartQuizFromDashboard = useCallback(() => {
    setQuizAutoStart(true)
    setActiveTab('quiz')
  }, [])

  /** Handle settings change from QuizHub (quiz mode changes) and persist. */
  const handleSettingsChange = useCallback((updated: UserSettings): void => {
    setSettings(updated)
  }, [])

  /**
   * Called by QuizHub when a session ends.
   * Records the session for the install-banner engagement threshold when the
   * user answered the minimum number of questions.
   */
  const handleQuizSessionComplete = useCallback(
    (questionsAnswered: number): void => {
      const MIN_QUESTIONS_FOR_ENGAGEMENT = 5
      if (questionsAnswered >= MIN_QUESTIONS_FOR_ENGAGEMENT) {
        recordQuizSession()
      }
    },
    [recordQuizSession],
  )

  /** Handle theme change from SettingsScreen. */
  const handleThemeChange = useCallback(
    (preference: UserSettings['theme']): void => {
      void setPreference(preference)
    },
    [setPreference],
  )

  // When returning to the home tab, refresh dashboard data.
  // Also clear the quiz auto-start flag whenever the tab changes.
  const handleTabChange = useCallback(
    (tab: AppTab): void => {
      setActiveTab(tab)
      setQuizAutoStart(false)
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
          autoDemo={autoDemoRef.current}
        />
      )}

      {/* Branded loading state while pairs are being fetched */}
      {pairsLoading && (
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
      )}

      {/* Main app shell — only shown after loading and when onboarding is complete */}
      {!pairsLoading && !showOnboarding && (
        <>
          {/*
           * Screen shell: position:relative provides the positioned ancestor for
           * TabBar's position:absolute. Each tab renders its screen (which owns a
           * PaperSurface) plus the shared TabBar at bottom:30 of this container.
           * minHeight:100dvh + width:100% ensures the shell fills the viewport so
           * bottom:30 resolves correctly against the visible screen area.
           *
           * LibraryScreen (words tab) previously rendered TabBar internally.
           * It is now uniform: all tabs render TabBar here, externally.
           */}
          <Box
            component="main"
            sx={{
              position: 'relative',
              minHeight: '100dvh',
              width: '100%',
            }}
          >
            {/*
             * Home tab: full-bleed Liquid Glass layout.
             * DashboardScreen owns its own PaperSurface (wallpaper, NavBar, scroll).
             * No AppBar or Container — those would conflict with the full-bleed design.
             */}
            {activeTab === 'home' && (
              <DashboardScreen
                activePair={activePair}
                settings={settings}
                todayStats={dashboardData.todayStats}
                wordProgressList={dashboardData.wordProgressList}
                words={dashboardData.words}
                totalWords={dashboardData.totalWords}
                streakDays={dashboardData.streakDays}
                loading={dashboardData.loading}
                onStartQuiz={handleStartQuizFromDashboard}
              />
            )}

            {/*
             * Quiz tab: full-bleed Liquid Glass layout (issue #148).
             * QuizHub owns its own PaperSurface (wallpaper, NavBar, scroll).
             * No AppBar or Container — those would conflict with the full-bleed design.
             */}
            {activeTab === 'quiz' && (
              <QuizHub
                pair={activePair}
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onSessionComplete={handleQuizSessionComplete}
                autoStart={quizAutoStart}
                onBrowseLibrary={() => handleTabChange('words')}
              />
            )}

            {/*
             * Words tab: full-bleed Liquid Glass layout (issue #149).
             * LibraryScreen owns its own PaperSurface (wallpaper, NavBar, scroll).
             * No AppBar or Container — those would conflict with the full-bleed design.
             * TabBar is rendered externally below (uniform pattern across all tabs, #162).
             */}
            {activeTab === 'words' && <LibraryScreen activePair={activePair} />}

            {/*
             * Stats tab: full-bleed Liquid Glass layout (issue #151).
             * StatsScreen owns its own PaperSurface (wallpaper, NavBar, scroll).
             * No AppBar or Container — those would conflict with the full-bleed design.
             */}
            {activeTab === 'stats' && <StatsScreen />}

            {/*
             * Settings tab: full-bleed Liquid Glass layout (issue #152).
             * SettingsScreen owns its own PaperSurface (wallpaper, NavBar, scroll).
             * No AppBar or Container — those would conflict with the full-bleed design.
             */}
            {activeTab === 'settings' && (
              <SettingsScreen
                themePreference={themePreference}
                onThemeChange={handleThemeChange}
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            )}

            {/*
             * Bottom navigation — uniform across all 5 tabs (#162).
             * TabBar uses position:absolute anchored to this screen shell container.
             * No tab exclusions: every non-onboarding tab renders TabBar here.
             */}
            {showNav && <TabBar activeTab={activeTab} onTabChange={handleTabChange} />}
          </Box>
        </>
      )}
      {/* Update notification — shown when a new service worker is waiting */}
      <UpdateNotification open={updateAvailable} onUpdate={applyUpdate} onDismiss={dismissUpdate} />

      {/* PWA install banner — only shown after engagement threshold, never on landing page */}
      <InstallBanner
        open={showBanner}
        platform={platform}
        onInstall={triggerInstall}
        onDismiss={dismissBanner}
      />
    </ThemeProvider>
  )
}

/**
 * Default export for lazy-loading via React.lazy in App.tsx.
 * The StorageContext is provided by the parent App component.
 */
export default AppContent
