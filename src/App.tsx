import { useMemo, useState, useCallback, useEffect } from 'react'
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Tab,
  Tabs,
} from '@mui/material'
import { createAppTheme } from './theme'
import { useThemeMode } from './hooks/useThemeMode'
import { LocalStorageService } from './services/storage'
import { StorageContext, useStorage } from './hooks/useStorage'
import {
  useLanguagePairs,
  LanguagePairSelector,
  CreatePairDialog,
  LanguagePairList,
} from './features/language-pairs'
import type { CreatePairInput } from './features/language-pairs'
import { WordListScreen } from './features/words'
import { QuizHub } from './features/quiz'
import type { UserSettings } from './types'

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
  const { mode } = useThemeMode(storageService)
  const appTheme = useMemo(() => createAppTheme(mode), [mode])

  const { pairs, activePair, loading, createPair, switchPair, deletePair } = useLanguagePairs()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  // Whether this is the first launch (no pairs yet, after loading completes).
  const [isFirstLaunch, setIsFirstLaunch] = useState(false)
  // Active tab
  const [activeTab, setActiveTab] = useState<'quiz' | 'words' | 'pairs'>('quiz')

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

  useEffect(() => {
    if (!loading && pairs.length === 0) {
      setIsFirstLaunch(true)
      setCreateDialogOpen(true)
    }
  }, [loading, pairs.length])

  const handleCreatePair = useCallback(
    async (input: CreatePairInput): Promise<void> => {
      await createPair(input, true)
      setIsFirstLaunch(false)
    },
    [createPair],
  )

  const handleOpenCreateDialog = useCallback(() => {
    setCreateDialogOpen(true)
  }, [])

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false)
  }, [])

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />

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
            loading={loading}
            onSwitch={switchPair}
            onAddPair={handleOpenCreateDialog}
          />
        </Toolbar>
      </AppBar>

      {/* Navigation tabs — only show when there are pairs */}
      {!loading && pairs.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_e, v: 'quiz' | 'words' | 'pairs') => setActiveTab(v)}
            centered
          >
            <Tab label="Quiz" value="quiz" />
            <Tab label="Words" value="words" />
            <Tab label="Language pairs" value="pairs" />
          </Tabs>
        </Box>
      )}

      <Container maxWidth="sm" sx={{ py: 4 }}>
        {!loading && (
          <>
            {pairs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" gutterBottom fontWeight={700}>
                  Welcome to Lexio
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first language pair to get started.
                </Typography>
                <Button variant="contained" size="large" onClick={handleOpenCreateDialog}>
                  Create language pair
                </Button>
              </Box>
            ) : (
              <>
                {activeTab === 'quiz' && (
                  <QuizHub pair={activePair} settings={settings} onSettingsChange={setSettings} />
                )}

                {activeTab === 'words' && <WordListScreen activePair={activePair} />}

                {activeTab === 'pairs' && (
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        Language pairs
                      </Typography>
                      <Button variant="outlined" size="small" onClick={handleOpenCreateDialog}>
                        Add pair
                      </Button>
                    </Box>

                    <LanguagePairList
                      pairs={pairs}
                      activePairId={activePair?.id ?? null}
                      onDelete={deletePair}
                    />
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Container>

      <CreatePairDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        onSubmit={handleCreatePair}
        suggestDefault={isFirstLaunch}
      />
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <StorageContext.Provider value={storageService}>
      <AppContent />
    </StorageContext.Provider>
  )
}
