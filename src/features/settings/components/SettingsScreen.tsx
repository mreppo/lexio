/**
 * SettingsScreen - full settings/preferences feature.
 *
 * Sections:
 *  1. Preferences  - theme, quiz mode, daily goal, typo tolerance
 *  2. Training levels - CEFR level multi-select filter
 *  3. Language Pairs - list with word counts, links to pair management
 *  4. Data Management - export, import, reset progress, reset all
 *  5. About - version, GitHub link
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { ThemePreference, UserSettings, LanguagePair, CefrLevel } from '@/types'
import { useStorage } from '@/hooks/useStorage'
import { LanguagePairList } from '@/features/language-pairs'
import { countWordsByLevel } from '@/utils/cefrFilter'
import { CefrLevelSelector } from './CefrLevelSelector'

/** App version sourced from the bundler-injected env variable. */
const APP_VERSION = __APP_VERSION__

const DAILY_GOAL_PRESETS = [10, 20, 30, 50] as const

const TYPO_LABELS: Record<number, { label: string; description: string }> = {
  0: {
    label: 'Exact',
    description: 'Your answer must match exactly (case-insensitive).',
  },
  1: {
    label: 'Lenient',
    description: 'Up to 1 character difference is accepted (e.g. a missing accent).',
  },
  2: {
    label: 'Very lenient',
    description: 'Up to 2 character differences are accepted.',
  },
}

export interface SettingsScreenProps {
  /** The user's current theme preference. */
  readonly themePreference: ThemePreference
  /** Called when the user changes the theme preference. */
  readonly onThemeChange: (preference: ThemePreference) => void
  /** Current user settings (quiz mode, daily goal, typo tolerance). */
  readonly settings: UserSettings
  /** Called when any preference (except theme) changes. */
  readonly onSettingsChange: (updated: UserSettings) => void
  /** All language pairs with their word counts. */
  readonly pairs: readonly LanguagePair[]
  /** Open the create-pair dialog in the parent. */
  readonly onAddPair: () => void
  /** Delete a language pair and all its data. */
  readonly onDeletePair: (pairId: string) => Promise<void>
}

export function SettingsScreen({
  themePreference,
  onThemeChange,
  settings,
  onSettingsChange,
  pairs,
  onAddPair,
  onDeletePair,
}: SettingsScreenProps) {
  const storage = useStorage()

  // --- Preferences state ---
  const [dailyGoalInput, setDailyGoalInput] = useState<string>(String(settings.dailyGoal))

  // --- CEFR word counts state ---
  const [wordCountByLevel, setWordCountByLevel] = useState<Record<CefrLevel, number>>({
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0,
  })

  // Reload word counts when the active pair changes.
  useEffect(() => {
    if (settings.activePairId === null) {
      setWordCountByLevel({ A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 })
      return
    }
    void storage.getWords(settings.activePairId).then((words) => {
      setWordCountByLevel(countWordsByLevel(words))
    })
  }, [storage, settings.activePairId])

  // --- Data management state ---
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [pendingImportData, setPendingImportData] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [resetProgressConfirmOpen, setResetProgressConfirmOpen] = useState(false)
  const [resetAllConfirmOpen, setResetAllConfirmOpen] = useState(false)
  const [resetAllDoubleConfirmOpen, setResetAllDoubleConfirmOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  // --- Preference handlers ---

  const handleThemeChange = useCallback(
    (value: string) => {
      onThemeChange(value as ThemePreference)
    },
    [onThemeChange],
  )

  const handleQuizModeChange = useCallback(
    (value: string) => {
      void storage.saveSettings({ ...settings, quizMode: value as UserSettings['quizMode'] })
      onSettingsChange({ ...settings, quizMode: value as UserSettings['quizMode'] })
    },
    [settings, onSettingsChange, storage],
  )

  const handleDailyGoalPreset = useCallback(
    (value: number) => {
      setDailyGoalInput(String(value))
      void storage.saveSettings({ ...settings, dailyGoal: value })
      onSettingsChange({ ...settings, dailyGoal: value })
    },
    [settings, onSettingsChange, storage],
  )

  const handleDailyGoalInputChange = useCallback((value: string) => {
    setDailyGoalInput(value)
  }, [])

  const handleDailyGoalInputBlur = useCallback(() => {
    const parsed = parseInt(dailyGoalInput, 10)
    const clamped = isNaN(parsed) ? 1 : Math.max(1, Math.min(200, parsed))
    setDailyGoalInput(String(clamped))
    void storage.saveSettings({ ...settings, dailyGoal: clamped })
    onSettingsChange({ ...settings, dailyGoal: clamped })
  }, [dailyGoalInput, settings, onSettingsChange, storage])

  const handleTypoToleranceChange = useCallback(
    (_: Event, value: number | number[]) => {
      const tolerance = Array.isArray(value) ? value[0] : value
      void storage.saveSettings({ ...settings, typoTolerance: tolerance })
      onSettingsChange({ ...settings, typoTolerance: tolerance })
    },
    [settings, onSettingsChange, storage],
  )

  const handleSelectedLevelsChange = useCallback(
    (levels: readonly CefrLevel[]) => {
      void storage.saveSettings({ ...settings, selectedLevels: levels })
      onSettingsChange({ ...settings, selectedLevels: levels })
    },
    [settings, onSettingsChange, storage],
  )

  // --- Export ---

  const handleExport = useCallback(async () => {
    setExporting(true)
    setExportError(null)
    try {
      const json = await storage.exportAll()
      const today = new Date().toISOString().slice(0, 10)
      const filename = `lexio-backup-${today}.json`
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }, [storage])

  // --- Import ---

  const handleImportFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== 'string') {
        setImportError('Could not read file.')
        return
      }

      // Validate JSON structure before showing confirm dialog
      try {
        const parsed = JSON.parse(text) as unknown
        if (typeof parsed !== 'object' || parsed === null) {
          setImportError('Invalid backup file: not a JSON object.')
          return
        }
        const obj = parsed as Record<string, unknown>
        if (!Array.isArray(obj.languagePairs)) {
          setImportError('Invalid backup file: missing "languagePairs" array.')
          return
        }
        // Validation passed — ask for confirmation
        setPendingImportData(text)
        setImportError(null)
        setImportConfirmOpen(true)
      } catch {
        setImportError('Invalid backup file: could not parse JSON.')
      }
    }
    reader.readAsText(file)

    // Reset input so same file can be chosen again
    event.target.value = ''
  }, [])

  const handleImportConfirm = useCallback(async () => {
    if (!pendingImportData) return
    setImporting(true)
    setImportError(null)
    setImportConfirmOpen(false)
    try {
      await storage.importAll(pendingImportData)
      setPendingImportData(null)
      // Reload the page so all contexts/hooks pick up the restored data
      globalThis.location.reload()
    } catch {
      setImportError('Import failed. The backup file may be corrupted.')
      setImporting(false)
    }
  }, [pendingImportData, storage])

  const handleImportCancel = useCallback(() => {
    setImportConfirmOpen(false)
    setPendingImportData(null)
  }, [])

  const handleImportClick = useCallback(() => {
    setImportError(null)
    fileInputRef.current?.click()
  }, [])

  // --- Reset progress ---

  const handleResetProgressConfirm = useCallback(async () => {
    setResetting(true)
    setResetError(null)
    setResetProgressConfirmOpen(false)
    try {
      const allPairs = await storage.getLanguagePairs()
      for (const pair of allPairs) {
        const words = await storage.getWords(pair.id)
        for (const word of words) {
          const progress = await storage.getWordProgress(word.id)
          if (progress !== null) {
            // Reset progress by saving zeroed-out record
            await storage.saveWordProgress({
              wordId: word.id,
              correctCount: 0,
              incorrectCount: 0,
              streak: 0,
              lastReviewed: null,
              nextReview: Date.now(),
              confidence: 0,
              history: [],
            })
          }
        }
      }
      // Clear daily stats by exporting non-stats data and re-importing
      const exported = await storage.exportAll()
      const data = JSON.parse(exported) as Record<string, unknown>
      data['dailyStats'] = []
      await storage.importAll(JSON.stringify(data))
    } catch {
      setResetError('Reset failed. Please try again.')
    } finally {
      setResetting(false)
    }
  }, [storage])

  // --- Reset all ---

  const handleResetAllFirstConfirm = useCallback(() => {
    setResetAllConfirmOpen(false)
    setResetAllDoubleConfirmOpen(true)
  }, [])

  const handleResetAllFinalConfirm = useCallback(async () => {
    setResetting(true)
    setResetError(null)
    setResetAllDoubleConfirmOpen(false)
    try {
      await storage.clearAll()
      globalThis.location.reload()
    } catch {
      setResetError('Reset failed. Please try again.')
      setResetting(false)
    }
  }, [storage])

  const currentTypo = settings.typoTolerance
  const typoInfo = TYPO_LABELS[currentTypo] ?? TYPO_LABELS[1]

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      role="main"
      aria-label="Settings"
    >
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        aria-label="Import backup file"
        style={{ display: 'none' }}
        onChange={handleImportFileChange}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
        <SettingsIcon sx={{ color: 'text.secondary' }} aria-hidden="true" />
        <Typography variant="h6" fontWeight={700}>
          Settings
        </Typography>
      </Box>

      {/* ── 1. Preferences ── */}
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Preferences
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          {/* Theme */}
          <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
              Theme
            </FormLabel>
            <RadioGroup
              row
              value={themePreference}
              onChange={(e) => handleThemeChange(e.target.value)}
              aria-label="Theme preference"
            >
              <FormControlLabel value="system" control={<Radio size="small" />} label="System" />
              <FormControlLabel value="light" control={<Radio size="small" />} label="Light" />
              <FormControlLabel value="dark" control={<Radio size="small" />} label="Dark" />
            </RadioGroup>
          </FormControl>

          {/* Quiz mode */}
          <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
              Default quiz mode
            </FormLabel>
            <RadioGroup
              row
              value={settings.quizMode}
              onChange={(e) => handleQuizModeChange(e.target.value)}
              aria-label="Default quiz mode"
            >
              <FormControlLabel value="type" control={<Radio size="small" />} label="Type" />
              <FormControlLabel value="choice" control={<Radio size="small" />} label="Choice" />
              <FormControlLabel value="mixed" control={<Radio size="small" />} label="Mixed" />
            </RadioGroup>
          </FormControl>

          {/* Daily goal */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{ mb: 1, color: 'text.secondary', fontSize: '0.875rem' }}
            >
              Daily goal
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
              {DAILY_GOAL_PRESETS.map((preset) => (
                <Chip
                  key={preset}
                  label={preset}
                  size="small"
                  color={settings.dailyGoal === preset ? 'primary' : 'default'}
                  onClick={() => handleDailyGoalPreset(preset)}
                  aria-label={`Set daily goal to ${preset} words`}
                  aria-pressed={settings.dailyGoal === preset}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
            <TextField
              size="small"
              value={dailyGoalInput}
              onChange={(e) => handleDailyGoalInputChange(e.target.value)}
              onBlur={handleDailyGoalInputBlur}
              inputProps={{ min: 1, max: 200, 'aria-label': 'Custom daily goal' }}
              InputProps={{
                endAdornment: <InputAdornment position="end">words/day</InputAdornment>,
              }}
              sx={{ width: 160 }}
            />
          </Box>

          {/* Typo tolerance */}
          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}
            >
              Typo tolerance
            </Typography>
            <Slider
              value={settings.typoTolerance}
              onChange={handleTypoToleranceChange}
              min={0}
              max={2}
              step={1}
              marks={[
                { value: 0, label: 'Exact' },
                { value: 1, label: 'Lenient' },
                { value: 2, label: 'Lenient+' },
              ]}
              aria-label="Typo tolerance"
              aria-valuetext={typoInfo.label}
              sx={{ mt: 1, mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {typoInfo.description}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ── 2. CEFR Levels ── */}
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Training levels
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Choose which CEFR levels to include in your quizzes. Your manually added words are
            always included.
          </Typography>

          <CefrLevelSelector
            selectedLevels={settings.selectedLevels}
            wordCountByLevel={wordCountByLevel}
            onChange={handleSelectedLevelsChange}
          />
        </CardContent>
      </Card>

      {/* ── 3. Language Pairs ── */}
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Language pairs
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <LanguagePairList
            pairs={[...pairs]}
            activePairId={settings.activePairId}
            onDelete={onDeletePair}
          />

          <Button variant="outlined" size="small" onClick={onAddPair} sx={{ mt: 2 }} fullWidth>
            Add language pair
          </Button>
        </CardContent>
      </Card>

      {/* ── 4. Data Management ── */}
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Data management
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          {resetError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setResetError(null)}>
              {resetError}
            </Alert>
          )}

          <Stack spacing={1.5}>
            {/* Export */}
            {exportError && (
              <Alert severity="error" onClose={() => setExportError(null)}>
                {exportError}
              </Alert>
            )}
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={() => void handleExport()}
              disabled={exporting}
              fullWidth
              aria-label="Export data as JSON backup"
            >
              {exporting ? 'Exporting...' : 'Export data'}
            </Button>

            {/* Import */}
            {importError && (
              <Alert severity="error" onClose={() => setImportError(null)}>
                {importError}
              </Alert>
            )}
            <Button
              variant="outlined"
              startIcon={importing ? <CircularProgress size={16} /> : <UploadIcon />}
              onClick={handleImportClick}
              disabled={importing}
              fullWidth
              aria-label="Import data from JSON backup"
            >
              {importing ? 'Importing...' : 'Import data'}
            </Button>

            <Divider />

            {/* Reset progress */}
            <Button
              variant="outlined"
              color="warning"
              startIcon={
                resetting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />
              }
              onClick={() => setResetProgressConfirmOpen(true)}
              disabled={resetting}
              fullWidth
              aria-label="Reset all learning progress"
            >
              Reset progress
            </Button>

            {/* Reset all */}
            <Button
              variant="outlined"
              color="error"
              startIcon={
                resetting ? <CircularProgress size={16} color="inherit" /> : <WarningAmberIcon />
              }
              onClick={() => setResetAllConfirmOpen(true)}
              disabled={resetting}
              fullWidth
              aria-label="Reset all data and return to first-launch state"
            >
              Reset all data
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ── 5. About ── */}
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoOutlinedIcon
              fontSize="small"
              sx={{ color: 'text.secondary' }}
              aria-hidden="true"
            />
            <Typography variant="subtitle2" fontWeight={700}>
              About
            </Typography>
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Version {APP_VERSION}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Lexio — a language-agnostic vocabulary trainer with spaced repetition.
          </Typography>
          <Link
            href="https://github.com/mreppo/lexio"
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
          >
            View source on GitHub
          </Link>
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}

      {/* Import confirm */}
      <Dialog
        open={importConfirmOpen}
        onClose={handleImportCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
        aria-labelledby="import-dialog-title"
      >
        <DialogTitle id="import-dialog-title">
          <Typography variant="h6" component="span" fontWeight={700}>
            Import backup?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1 }}>
            This will overwrite your current data.
          </Alert>
          <Typography variant="body2">
            All existing language pairs, words, progress, and stats will be replaced with the data
            from the backup file. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={handleImportCancel}>
            Cancel
          </Button>
          <Button variant="contained" color="warning" onClick={() => void handleImportConfirm()}>
            Import and overwrite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset progress confirm */}
      <Dialog
        open={resetProgressConfirmOpen}
        onClose={() => setResetProgressConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
        aria-labelledby="reset-progress-dialog-title"
      >
        <DialogTitle id="reset-progress-dialog-title">
          <Typography variant="h6" component="span" fontWeight={700}>
            Reset learning progress?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            This will clear all word progress, streaks, and daily stats. Your language pairs and
            words will be kept.
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setResetProgressConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => void handleResetProgressConfirm()}
          >
            Reset progress
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset all - first confirm */}
      <Dialog
        open={resetAllConfirmOpen}
        onClose={() => setResetAllConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
        aria-labelledby="reset-all-dialog-title"
      >
        <DialogTitle id="reset-all-dialog-title">
          <Typography variant="h6" component="span" fontWeight={700}>
            Reset all data?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 1 }}>
            This will delete everything.
          </Alert>
          <Typography variant="body1">
            All language pairs, words, progress, stats, and settings will be permanently erased. The
            app will return to the first-launch state.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setResetAllConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleResetAllFirstConfirm}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset all - second (double) confirm */}
      <Dialog
        open={resetAllDoubleConfirmOpen}
        onClose={() => setResetAllDoubleConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
        aria-labelledby="reset-all-double-dialog-title"
      >
        <DialogTitle id="reset-all-double-dialog-title">
          <Typography variant="h6" component="span" fontWeight={700}>
            Are you absolutely sure?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            There is no way to undo this. All your data will be gone permanently.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setResetAllDoubleConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleResetAllFinalConfirm()}
          >
            Yes, delete everything
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
