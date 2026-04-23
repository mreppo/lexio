/**
 * SettingsScreen — Liquid Glass rebuild (issue #152).
 *
 * Layout (top to bottom, inside PaperSurface):
 *   1. NavBar large prominentTitle="Settings"
 *   2. Account card (auth placeholder) — Glass floating + 56×56 gradient avatar
 *   3. SectionHeader "Daily practice" + Glass card
 *      - Daily goal row (flash/warn)
 *      - Reminder stub row (bell/red)
 *      - Sound effects toggle row (speaker/violet)
 *   4. SectionHeader "Quiz" + Glass card
 *      - Quiz mode row (card/accent) → picker dialog
 *      - Show hints row (clock/ok)
 *      - Auto-play pronunciation toggle (speaker/violet)
 *   5. SectionHeader "Appearance" + Glass card
 *      - Theme row → picker dialog
 *   6. SectionHeader "Data" + Glass card
 *      - Export vocabulary (share/ok)
 *      - Import from file (plus/accent)
 *      - Reset progress (close/red, destructive confirm)
 *   7. Bottom spacer
 *
 * Screen renders <PaperSurface> + its own <NavBar>.
 * TabBar is rendered externally by AppContent (no TabBar inside this screen).
 */

import { useState, useCallback, useRef } from 'react'
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
} from '@mui/material'
import { Zap, Bell, Volume2, Layers, Clock, Share, Plus, X, ChevronRight } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { PaperSurface } from '@/components/primitives/PaperSurface'
import { Glass } from '@/components/primitives/Glass'
import { NavBar } from '@/components/composites/NavBar'
import { SectionHeader } from '@/components/composites/SectionHeader'
import { GlassRow } from '@/components/composites/GlassRow'
import { Toggle } from '@/components/atoms/Toggle'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import { useStorage } from '@/hooks/useStorage'
import type { UserSettings } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Bottom spacer — clears the fixed TabBar. */
const TAB_BAR_SPACER = 140

const QUIZ_MODE_LABELS: Record<UserSettings['quizMode'], string> = {
  type: 'Type',
  choice: 'Choice',
  mixed: 'Mixed',
}

const THEME_LABELS: Record<UserSettings['theme'], string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SettingsScreenProps {
  /** Current user settings. */
  readonly settings: UserSettings
  /** Called when any setting field changes. */
  readonly onSettingsChange: (updated: UserSettings) => void
  /** Current theme preference (from useThemeMode). */
  readonly themePreference: UserSettings['theme']
  /** Called when the user selects a different theme. */
  readonly onThemeChange: (preference: UserSettings['theme']) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsScreen({
  settings,
  onSettingsChange,
  themePreference,
  onThemeChange,
}: SettingsScreenProps): React.JSX.Element {
  const storage = useStorage()
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  // ── Local state ─────────────────────────────────────────────────────────────

  const [quizPickerOpen, setQuizPickerOpen] = useState(false)
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [pendingImportData, setPendingImportData] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Derived values ───────────────────────────────────────────────────────────

  const displayName = settings.displayName ?? null
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : 'L'
  const profileName = displayName ?? 'Lexio user'
  const soundEffects = settings.soundEffects ?? false
  const autoPlayPronunciation = settings.autoPlayPronunciation ?? false

  // ── Settings update helper ───────────────────────────────────────────────────

  const persistSettings = useCallback(
    (patch: Partial<UserSettings>): void => {
      const updated = { ...settings, ...patch }
      void storage.saveSettings(updated)
      onSettingsChange(updated)
    },
    [settings, storage, onSettingsChange],
  )

  // ── Quiz mode picker ─────────────────────────────────────────────────────────

  const handleQuizModeChange = useCallback(
    (value: string): void => {
      persistSettings({ quizMode: value as UserSettings['quizMode'] })
      setQuizPickerOpen(false)
    },
    [persistSettings],
  )

  // ── Theme picker ─────────────────────────────────────────────────────────────

  const handleThemePickerChange = useCallback(
    (value: string): void => {
      onThemeChange(value as UserSettings['theme'])
      setThemePickerOpen(false)
    },
    [onThemeChange],
  )

  // ── Toggles ──────────────────────────────────────────────────────────────────

  const handleSoundEffectsToggle = useCallback(
    (next: boolean): void => {
      persistSettings({ soundEffects: next })
    },
    [persistSettings],
  )

  const handleAutoPlayToggle = useCallback(
    (next: boolean): void => {
      persistSettings({ autoPlayPronunciation: next })
    },
    [persistSettings],
  )

  // ── Export ───────────────────────────────────────────────────────────────────

  const handleExport = useCallback(async (): Promise<void> => {
    if (settings.activePairId === null) {
      setToastMessage('No active language pair to export.')
      return
    }
    setExporting(true)
    try {
      // Export active pair words as CSV
      const words = await storage.getWords(settings.activePairId)
      const rows = [
        'source,target,notes,tags',
        ...words.map((w) => {
          const src = `"${w.source.replace(/"/g, '""')}"`
          const tgt = `"${w.target.replace(/"/g, '""')}"`
          const notes = `"${(w.notes ?? '').replace(/"/g, '""')}"`
          const tags = `"${w.tags.join(';').replace(/"/g, '""')}"`
          return `${src},${tgt},${notes},${tags}`
        }),
      ]
      const csv = rows.join('\n')
      const today = new Date().toISOString().slice(0, 10)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lexio-vocabulary-${today}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setToastMessage('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }, [storage, settings.activePairId])

  // ── Import ───────────────────────────────────────────────────────────────────

  const handleImportClick = useCallback((): void => {
    setImportError(null)
    fileInputRef.current?.click()
  }, [])

  const handleImportFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e): void => {
      const text = e.target?.result
      if (typeof text !== 'string') {
        setImportError('Could not read file.')
        return
      }
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
        setPendingImportData(text)
        setImportError(null)
        setImportConfirmOpen(true)
      } catch {
        setImportError('Invalid backup file: could not parse JSON.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }, [])

  const handleImportConfirm = useCallback(async (): Promise<void> => {
    if (!pendingImportData) return
    setImportConfirmOpen(false)
    try {
      await storage.importAll(pendingImportData)
      setPendingImportData(null)
      globalThis.location.reload()
    } catch {
      setImportError('Import failed. The backup file may be corrupted.')
    }
  }, [pendingImportData, storage])

  const handleImportCancel = useCallback((): void => {
    setImportConfirmOpen(false)
    setPendingImportData(null)
  }, [])

  // ── Reset progress ───────────────────────────────────────────────────────────

  const handleResetConfirm = useCallback(async (): Promise<void> => {
    setResetting(true)
    setResetError(null)
    setResetConfirmOpen(false)
    try {
      const allPairs = await storage.getLanguagePairs()
      for (const pair of allPairs) {
        const words = await storage.getWords(pair.id)
        for (const word of words) {
          const progress = await storage.getWordProgress(word.id)
          if (progress !== null) {
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
      // Clear daily stats
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <PaperSurface>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        aria-label="Import backup file"
        style={{ display: 'none' }}
        onChange={handleImportFileChange}
      />

      {/* ── NavBar ── */}
      <NavBar large prominentTitle="Settings" />

      {/* ── Scrollable content ── */}
      <Box sx={{ px: '16px', pb: `${TAB_BAR_SPACER}px` }}>
        {/* ── Account card ── */}
        <Box sx={{ mb: '8px' }}>
          <Glass pad={16} floating>
            <Box
              component="button"
              type="button"
              onClick={() => setToastMessage('Accounts coming soon')}
              aria-label="Account settings — coming soon"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: 'none',
                border: 'none',
                p: 0,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* 56×56 gradient avatar */}
              <Box
                aria-hidden="true"
                sx={{
                  flexShrink: 0,
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: tokens.color.avatarGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontFamily: glassTypography.display,
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1,
                  }}
                >
                  {avatarInitial}
                </Box>
              </Box>

              {/* Name + helper */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    fontFamily: glassTypography.body,
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '-0.3px',
                    lineHeight: 1.2,
                    color: tokens.color.ink,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profileName}
                </Box>
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    fontFamily: glassTypography.body,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: tokens.color.inkSec,
                    mt: '2px',
                  }}
                >
                  Local profile · sign-in coming soon
                </Box>
              </Box>

              {/* Chevron */}
              <Box aria-hidden="true" sx={{ flexShrink: 0 }}>
                <ChevronRight size={16} strokeWidth={2} color={tokens.color.inkFaint} />
              </Box>
            </Box>
          </Glass>
        </Box>

        {/* ── Daily practice section ── */}
        <SectionHeader>Daily practice</SectionHeader>
        <Glass pad={0} floating>
          <GlassRow
            icon={Zap}
            iconBg={tokens.color.warn}
            title="Daily goal"
            detail={`${settings.dailyGoal} words`}
            chevron={false}
            isLast={false}
          />
          <GlassRow
            icon={Bell}
            iconBg={tokens.color.red}
            title="Reminder"
            detail="9:00 AM"
            chevron={false}
            isLast={false}
          />
          <GlassRow
            icon={Volume2}
            iconBg={tokens.color.violet}
            title="Sound effects"
            chevron={false}
            isLast
            accessory={
              <Toggle
                on={soundEffects}
                onChange={handleSoundEffectsToggle}
                aria-label="Sound effects"
              />
            }
          />
        </Glass>

        {/* ── Quiz section ── */}
        <SectionHeader>Quiz</SectionHeader>
        <Glass pad={0} floating>
          <GlassRow
            icon={Layers}
            iconBg={tokens.color.accent}
            title="Quiz mode"
            detail={QUIZ_MODE_LABELS[settings.quizMode]}
            onClick={() => setQuizPickerOpen(true)}
            isLast={false}
          />
          <GlassRow
            icon={Clock}
            iconBg={tokens.color.ok}
            title="Show hints"
            detail="After 10s"
            chevron={false}
            isLast={false}
          />
          <GlassRow
            icon={Volume2}
            iconBg={tokens.color.violet}
            title="Auto-play pronunciation"
            chevron={false}
            isLast
            accessory={
              <Toggle
                on={autoPlayPronunciation}
                onChange={handleAutoPlayToggle}
                aria-label="Auto-play pronunciation"
              />
            }
          />
        </Glass>

        {/* ── Appearance section ── */}
        <SectionHeader>Appearance</SectionHeader>
        <Glass pad={0} floating>
          <GlassRow
            title="Theme"
            detail={THEME_LABELS[themePreference]}
            onClick={() => setThemePickerOpen(true)}
            isLast
          />
        </Glass>

        {/* ── Data section ── */}
        <SectionHeader>Data</SectionHeader>
        <Glass pad={0} floating>
          <GlassRow
            icon={Share}
            iconBg={tokens.color.ok}
            title="Export vocabulary"
            detail={exporting ? 'Exporting…' : undefined}
            onClick={() => {
              void handleExport()
            }}
            isLast={false}
          />
          <GlassRow
            icon={Plus}
            iconBg={tokens.color.accent}
            title="Import from file"
            onClick={handleImportClick}
            isLast={false}
          />
          <GlassRow
            icon={X}
            iconBg={tokens.color.red}
            title="Reset progress"
            onClick={() => setResetConfirmOpen(true)}
            isLast
          />
        </Glass>

        {/* Import error feedback */}
        {importError && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setImportError(null)}>
            {importError}
          </Alert>
        )}

        {/* Reset error feedback */}
        {resetError && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setResetError(null)}>
            {resetError}
          </Alert>
        )}
      </Box>

      {/* ── Quiz mode picker dialog ── */}
      <Dialog
        open={quizPickerOpen}
        onClose={() => setQuizPickerOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        aria-labelledby="quiz-mode-dialog-title"
      >
        <DialogTitle id="quiz-mode-dialog-title">
          <Typography variant="h6" component="span" fontWeight={700}>
            Quiz mode
          </Typography>
        </DialogTitle>
        <DialogContent>
          <RadioGroup
            value={settings.quizMode}
            onChange={(e) => handleQuizModeChange(e.target.value)}
            aria-label="Quiz mode"
          >
            <FormControlLabel value="type" control={<Radio />} label="Type" />
            <FormControlLabel value="choice" control={<Radio />} label="Choice" />
            <FormControlLabel value="mixed" control={<Radio />} label="Mixed" />
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setQuizPickerOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Theme picker dialog ── */}
      <Dialog
        open={themePickerOpen}
        onClose={() => setThemePickerOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        aria-labelledby="theme-dialog-title"
      >
        <DialogTitle id="theme-dialog-title">
          <Typography variant="h6" component="span" fontWeight={700}>
            Appearance
          </Typography>
        </DialogTitle>
        <DialogContent>
          <RadioGroup
            value={themePreference}
            onChange={(e) => handleThemePickerChange(e.target.value)}
            aria-label="Theme preference"
          >
            <FormControlLabel value="system" control={<Radio />} label="System" />
            <FormControlLabel value="light" control={<Radio />} label="Light" />
            <FormControlLabel value="dark" control={<Radio />} label="Dark" />
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setThemePickerOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Import confirm dialog ── */}
      <Dialog
        open={importConfirmOpen}
        onClose={handleImportCancel}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
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
            All existing language pairs, words, progress, and stats will be replaced. This cannot be
            undone.
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

      {/* ── Reset progress confirm dialog ── */}
      <Dialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
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
          <Button
            variant="outlined"
            onClick={() => setResetConfirmOpen(false)}
            disabled={resetting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleResetConfirm()}
            disabled={resetting}
          >
            {resetting ? 'Resetting…' : 'Reset progress'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast notifications ── */}
      <Snackbar
        open={toastMessage !== null}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </PaperSurface>
  )
}
