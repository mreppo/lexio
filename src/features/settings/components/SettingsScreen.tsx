/**
 * SettingsScreen — Liquid Glass rebuild (issue #152).
 *
 * Layout (top to bottom, inside PaperSurface):
 *   1. NavBar large prominentTitle="Settings"
 *   2. Account card (auth placeholder) — Glass floating + 56×56 gradient avatar
 *   3. SectionHeader "Daily practice" + Glass card
 *      - Daily goal row (flash/warn) → drill-down sub-screen
 *      - Reminder stub row (bell/red) → drill-down sub-screen
 *      - Sound effects toggle row (speaker/violet)
 *   4. SectionHeader "Quiz" + Glass card
 *      - Quiz mode row (card/accent) → drill-down sub-screen
 *      - Show hints row (clock/ok) → drill-down sub-screen
 *      - Auto-play pronunciation toggle (speaker/violet)
 *   5. SectionHeader "Appearance" + Glass card
 *      - Theme row → drill-down sub-screen
 *   6. SectionHeader "Data" + Glass card
 *      - Export vocabulary (share/ok)
 *      - Import from file (plus/accent)
 *      - Reset progress (close/red, iOS-styled alert)
 *   7. Bottom spacer
 *
 * Navigation (issue #186):
 *   Option pickers use local-state drill-down sub-screens (no router changes).
 *   Render either the main list or the active sub-screen.
 *   Back navigation restores scroll position.
 *   Slide-from-right push transition; slide-back on pop.
 *
 * Alert dialogs (issue #186):
 *   Reset progress + Import confirmation use iOS-styled centered alerts
 *   (no Material drop-shadow, destructive red action).
 *
 * Screen renders <PaperSurface> + its own <NavBar>.
 * TabBar is rendered externally by AppContent (no TabBar inside this screen).
 */

import { useState, useCallback, useRef } from 'react'
import { Box, Snackbar, Alert } from '@mui/material'
import {
  Zap,
  Bell,
  Volume2,
  Layers,
  Clock,
  Share,
  Plus,
  X,
  ChevronRight,
  Check,
  ChevronLeft,
} from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { PaperSurface } from '@/components/primitives/PaperSurface'
import { Glass } from '@/components/primitives/Glass'
import { NavBar } from '@/components/composites/NavBar'
import { SectionHeader } from '@/components/composites/SectionHeader'
import { GlassRow } from '@/components/composites/GlassRow'
import { IOSAlert } from '@/components/composites/IOSAlert'
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

const DAILY_GOAL_PRESETS = [5, 10, 20, 30, 50] as const

const SHOW_HINT_LABELS: Record<string, string> = {
  '0': 'Off',
  '5': 'After 5s',
  '10': 'After 10s',
  '15': 'After 15s',
  '30': 'After 30s',
}

// ─── Sub-screen types ─────────────────────────────────────────────────────────

type ActiveSubScreen = 'quiz-mode' | 'theme' | 'daily-goal' | 'show-hint' | 'reminder' | null

// ─── Back Button ──────────────────────────────────────────────────────────────

interface BackButtonProps {
  readonly label: string
  readonly onClick: () => void
}

function BackButton({ label, onClick }: BackButtonProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={`Back to Settings`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 0',
        fontFamily: glassTypography.body,
        fontSize: '17px',
        fontWeight: 400,
        letterSpacing: '-0.3px',
        color: tokens.color.accent,
        WebkitTapHighlightColor: 'transparent',
        transition: 'opacity 120ms ease',
        '&:active': { opacity: 0.7 },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:active': { opacity: 1 },
        },
      }}
    >
      <ChevronLeft size={20} strokeWidth={2.5} />
      {label}
    </Box>
  )
}

// ─── Option Row ────────────────────────────────────────────────────────────────

interface OptionRowProps {
  readonly label: string
  readonly selected: boolean
  readonly onSelect: () => void
  readonly isLast?: boolean
}

/**
 * A drill-down sub-screen option row. Shows a checkmark when selected.
 */
function OptionRow({
  label,
  selected,
  onSelect,
  isLast = false,
}: OptionRowProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box
      component="button"
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '12px 16px',
        gap: '12px',
        borderBottom: isLast ? 'none' : `0.5px solid ${tokens.color.rule2}`,
        WebkitTapHighlightColor: 'transparent',
        transition: 'opacity 100ms ease',
        '&:active': { opacity: 0.6 },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      <Box
        component="span"
        sx={{
          flex: 1,
          fontFamily: glassTypography.body,
          fontSize: '17px',
          fontWeight: 400,
          letterSpacing: '-0.3px',
          color: tokens.color.ink,
          textAlign: 'left',
        }}
      >
        {label}
      </Box>
      {selected && (
        <Box aria-hidden="true" sx={{ flexShrink: 0, color: tokens.color.accent }}>
          <Check size={20} strokeWidth={2.5} />
        </Box>
      )}
    </Box>
  )
}

// ─── Drill-down Sub-screen Wrapper ────────────────────────────────────────────

interface SubScreenProps {
  readonly title: string
  readonly onBack: () => void
  readonly visible: boolean
  readonly children: React.ReactNode
}

/**
 * Wraps drill-down sub-screen content with iOS-style slide-from-right transition.
 */
function SubScreen({ title, onBack, visible, children }: SubScreenProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box
      role="dialog"
      aria-label={title}
      aria-modal="false"
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        background: tokens.color.bg,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        overflowY: 'auto',
      }}
    >
      <NavBar title={title} leading={<BackButton label="Settings" onClick={onBack} />} />
      <Box sx={{ px: '16px', pb: `${TAB_BAR_SPACER}px` }}>{children}</Box>
    </Box>
  )
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

  const [activeSubScreen, setActiveSubScreen] = useState<ActiveSubScreen>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [importingData, setImportingData] = useState(false)
  const [pendingImportData, setPendingImportData] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const savedScrollY = useRef(0)

  // ── Derived values ───────────────────────────────────────────────────────────

  const displayName = settings.displayName ?? null
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : 'L'
  const profileName = displayName ?? 'Lexio user'
  const soundEffects = settings.soundEffects ?? false
  const autoPlayPronunciation = settings.autoPlayPronunciation ?? false

  // showHintTimeout: stored as number of seconds; 0 means "Off"
  const showHintSeconds = settings.showHintTimeout ?? 10
  const showHintLabel = SHOW_HINT_LABELS[String(showHintSeconds)] ?? `After ${showHintSeconds}s`

  // ── Sub-screen navigation ────────────────────────────────────────────────────

  const openSubScreen = useCallback((screen: ActiveSubScreen): void => {
    // Save scroll position before navigating away
    savedScrollY.current = scrollRef.current?.scrollTop ?? 0
    setActiveSubScreen(screen)
  }, [])

  const closeSubScreen = useCallback((): void => {
    setActiveSubScreen(null)
    // Restore scroll position after transition completes
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = savedScrollY.current
      }
    })
  }, [])

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
    (value: UserSettings['quizMode']): void => {
      persistSettings({ quizMode: value })
      closeSubScreen()
    },
    [persistSettings, closeSubScreen],
  )

  // ── Theme picker ─────────────────────────────────────────────────────────────

  const handleThemePickerChange = useCallback(
    (value: UserSettings['theme']): void => {
      onThemeChange(value)
      closeSubScreen()
    },
    [onThemeChange, closeSubScreen],
  )

  // ── Daily goal picker ────────────────────────────────────────────────────────

  const handleDailyGoalChange = useCallback(
    (value: number): void => {
      persistSettings({ dailyGoal: value })
      closeSubScreen()
    },
    [persistSettings, closeSubScreen],
  )

  // ── Show hint picker ─────────────────────────────────────────────────────────

  const handleShowHintChange = useCallback(
    (seconds: number): void => {
      persistSettings({ showHintTimeout: seconds })
      closeSubScreen()
    },
    [persistSettings, closeSubScreen],
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
    setImportingData(true)
    try {
      await storage.importAll(pendingImportData)
      setPendingImportData(null)
      globalThis.location.reload()
    } catch {
      setImportError('Import failed. The backup file may be corrupted.')
    } finally {
      setImportingData(false)
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
    <PaperSurface sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        aria-label="Import backup file"
        style={{ display: 'none' }}
        onChange={handleImportFileChange}
      />

      {/* ── Main settings list ── */}
      <Box
        ref={scrollRef}
        sx={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
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
              onClick={() => openSubScreen('daily-goal')}
              isLast={false}
            />
            <GlassRow
              icon={Bell}
              iconBg={tokens.color.red}
              title="Reminder"
              detail="9:00 AM"
              onClick={() => openSubScreen('reminder')}
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
              onClick={() => openSubScreen('quiz-mode')}
              isLast={false}
            />
            <GlassRow
              icon={Clock}
              iconBg={tokens.color.ok}
              title="Show hints"
              detail={showHintLabel}
              onClick={() => openSubScreen('show-hint')}
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
              onClick={() => openSubScreen('theme')}
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
      </Box>

      {/* ── Quiz mode sub-screen ── */}
      <SubScreen
        title="Quiz mode"
        onBack={closeSubScreen}
        visible={activeSubScreen === 'quiz-mode'}
      >
        <Glass pad={0} floating>
          {(['type', 'choice', 'mixed'] as const).map((mode, i, arr) => (
            <OptionRow
              key={mode}
              label={QUIZ_MODE_LABELS[mode]}
              selected={settings.quizMode === mode}
              onSelect={() => handleQuizModeChange(mode)}
              isLast={i === arr.length - 1}
            />
          ))}
        </Glass>
      </SubScreen>

      {/* ── Theme sub-screen ── */}
      <SubScreen title="Appearance" onBack={closeSubScreen} visible={activeSubScreen === 'theme'}>
        <Glass pad={0} floating>
          {(['system', 'light', 'dark'] as const).map((t, i, arr) => (
            <OptionRow
              key={t}
              label={THEME_LABELS[t]}
              selected={themePreference === t}
              onSelect={() => handleThemePickerChange(t)}
              isLast={i === arr.length - 1}
            />
          ))}
        </Glass>
      </SubScreen>

      {/* ── Daily goal sub-screen ── */}
      <SubScreen
        title="Daily goal"
        onBack={closeSubScreen}
        visible={activeSubScreen === 'daily-goal'}
      >
        <Glass pad={0} floating>
          {DAILY_GOAL_PRESETS.map((goal, i) => (
            <OptionRow
              key={goal}
              label={`${goal} words`}
              selected={settings.dailyGoal === goal}
              onSelect={() => handleDailyGoalChange(goal)}
              isLast={i === DAILY_GOAL_PRESETS.length - 1}
            />
          ))}
        </Glass>
      </SubScreen>

      {/* ── Show hint timeout sub-screen ── */}
      <SubScreen
        title="Show hints"
        onBack={closeSubScreen}
        visible={activeSubScreen === 'show-hint'}
      >
        <Glass pad={0} floating>
          {([0, 5, 10, 15, 30] as const).map((secs, i, arr) => (
            <OptionRow
              key={secs}
              label={SHOW_HINT_LABELS[String(secs)] ?? `After ${secs}s`}
              selected={showHintSeconds === secs}
              onSelect={() => handleShowHintChange(secs)}
              isLast={i === arr.length - 1}
            />
          ))}
        </Glass>
      </SubScreen>

      {/* ── Reminder sub-screen (stub — time picker coming soon) ── */}
      <SubScreen title="Reminder" onBack={closeSubScreen} visible={activeSubScreen === 'reminder'}>
        <Glass pad={16} floating>
          <Box
            sx={{
              fontFamily: glassTypography.body,
              fontSize: '15px',
              fontWeight: 500,
              color: tokens.color.inkSec,
              textAlign: 'center',
              py: '12px',
            }}
          >
            Reminder scheduling coming soon.
          </Box>
        </Glass>
      </SubScreen>

      {/* ── Import confirm alert (iOS-styled) ── */}
      <IOSAlert
        open={importConfirmOpen}
        title="Import backup?"
        message="This will overwrite all existing language pairs, words, progress, and stats. This cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Import and overwrite"
        destructive
        disabled={importingData}
        onCancel={handleImportCancel}
        onConfirm={() => void handleImportConfirm()}
      />

      {/* ── Reset progress confirm alert (iOS-styled) ── */}
      <IOSAlert
        open={resetConfirmOpen}
        title="Reset learning progress?"
        message="This will clear all word progress, streaks, and daily stats. Your language pairs and words will be kept. This action cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Reset progress"
        destructive
        disabled={resetting}
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={() => void handleResetConfirm()}
      />

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
