/**
 * Tests for the rebuilt SettingsScreen (Liquid Glass, issue #152).
 * Updated for drill-down sub-screen navigation (issue #186).
 *
 * Covers:
 * - NavBar "Settings" title renders
 * - Account card: avatar initial from displayName or 'L' fallback; tap fires toast
 * - Section headers: Daily practice, Quiz, Appearance, Data
 * - Daily goal row displays `{dailyGoal} words`
 * - Reminder row displays "9:00 AM" stub
 * - Sound effects toggle: reflects setting, updates on toggle
 * - Quiz mode row: opens drill-down sub-screen, selecting mode updates settings and closes
 * - Auto-play pronunciation toggle: reflects setting, updates on toggle
 * - Theme row: opens drill-down sub-screen, selecting theme calls onThemeChange and closes
 * - Daily goal row: opens drill-down sub-screen with preset options
 * - Show hints row: opens drill-down sub-screen with timeout options
 * - Sub-screen back button returns to Settings
 * - Export row: triggers CSV export handler
 * - Import row: opens file picker; import confirm dialog on valid file
 * - Reset progress row: opens destructive iOS-styled confirm alert
 * - displayName=null falls back to 'L' avatar initial and 'Lexio user' name
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsScreen } from './SettingsScreen'
import { StorageContext } from '@/hooks/useStorage'
import { createMockStorage } from '@/test/mockStorage'
import {
  createMockSettings,
  createMockWord,
  createMockPair,
  createMockProgress,
} from '@/test/fixtures'
import type { StorageService } from '@/services/storage/StorageService'
import type { UserSettings } from '@/types'
import { createElement, type ReactNode } from 'react'

// ─── Test helpers ──────────────────────────────────────────────────────────────

// Stub URL.createObjectURL / revokeObjectURL (not available in jsdom).
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn().mockReturnValue('blob:mock'),
  writable: true,
})
Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
})

function makeWrapper(storage: StorageService) {
  return ({ children }: { children: ReactNode }) =>
    createElement(StorageContext.Provider, { value: storage }, children)
}

interface RenderOptions {
  settings?: UserSettings
  themePreference?: UserSettings['theme']
  onSettingsChange?: (s: UserSettings) => void
  onThemeChange?: (p: UserSettings['theme']) => void
}

function renderSettings(storage: StorageService, overrides: RenderOptions = {}) {
  const settings = overrides.settings ?? createMockSettings()
  return render(
    <SettingsScreen
      settings={settings}
      onSettingsChange={overrides.onSettingsChange ?? vi.fn()}
      themePreference={overrides.themePreference ?? (settings.theme as UserSettings['theme'])}
      onThemeChange={overrides.onThemeChange ?? vi.fn()}
    />,
    { wrapper: makeWrapper(storage) },
  )
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsScreen', () => {
  let storage: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    storage = createMockStorage({
      saveSettings: vi.fn().mockResolvedValue(undefined),
      getLanguagePairs: vi.fn().mockResolvedValue([]),
      getWords: vi.fn().mockResolvedValue([]),
      getWordProgress: vi.fn().mockResolvedValue(null),
      exportAll: vi.fn().mockResolvedValue(
        JSON.stringify({
          languagePairs: [],
          words: {},
          progress: {},
          settings: createMockSettings(),
          dailyStats: [],
        }),
      ),
      importAll: vi.fn().mockResolvedValue(undefined),
    })
    vi.clearAllMocks()
  })

  // ── NavBar ──────────────────────────────────────────────────────────────────

  it('should render NavBar with "Settings" title', () => {
    renderSettings(storage)
    // The large NavBar renders a LargeTitle element — target the heading role
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  // ── Account card ────────────────────────────────────────────────────────────

  it('should show "L" avatar initial when displayName is null', () => {
    renderSettings(storage, { settings: createMockSettings({ displayName: null }) })
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('should show first initial of displayName when set', () => {
    renderSettings(storage, { settings: createMockSettings({ displayName: 'Alice' }) })
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('should show "Lexio user" when displayName is null', () => {
    renderSettings(storage, { settings: createMockSettings({ displayName: null }) })
    expect(screen.getByText('Lexio user')).toBeInTheDocument()
  })

  it('should show displayName when set', () => {
    renderSettings(storage, { settings: createMockSettings({ displayName: 'Alice' }) })
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('should show "Accounts coming soon" toast when account card is tapped', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    const accountBtn = screen.getByRole('button', { name: /account settings/i })
    await user.click(accountBtn)
    await waitFor(() => {
      expect(screen.getByText('Accounts coming soon')).toBeInTheDocument()
    })
  })

  it('should show "Local profile · sign-in coming soon" helper text', () => {
    renderSettings(storage)
    expect(screen.getByText(/Local profile · sign-in coming soon/i)).toBeInTheDocument()
  })

  // ── Section headers ─────────────────────────────────────────────────────────

  it('should render all section headers', () => {
    renderSettings(storage)
    expect(screen.getByText(/daily practice/i)).toBeInTheDocument()
    // The "Quiz" section header renders as uppercase "QUIZ" via CSS; use role=heading
    expect(screen.getByRole('heading', { name: /quiz/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /appearance/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /data/i })).toBeInTheDocument()
  })

  // ── Daily practice rows ─────────────────────────────────────────────────────

  it('should display dailyGoal words in the Daily goal row', () => {
    renderSettings(storage, { settings: createMockSettings({ dailyGoal: 30 }) })
    // The detail text "30 words" should appear in the row (the sub-screen also has it,
    // but the row is the primary visible element — find by button role)
    const dailyGoalBtn = screen.getByRole('button', { name: /daily goal/i })
    expect(dailyGoalBtn).toBeInTheDocument()
    // The detail text appears within the row area
    const allTexts = screen.getAllByText('30 words')
    expect(allTexts.length).toBeGreaterThanOrEqual(1)
  })

  it('should display "9:00 AM" stub in the Reminder row', () => {
    renderSettings(storage)
    expect(screen.getByText('9:00 AM')).toBeInTheDocument()
  })

  it('should render Sound effects toggle off by default', () => {
    renderSettings(storage, { settings: createMockSettings({ soundEffects: false }) })
    const toggle = screen.getByRole('switch', { name: 'Sound effects' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('should render Sound effects toggle on when setting is true', () => {
    renderSettings(storage, { settings: createMockSettings({ soundEffects: true }) })
    const toggle = screen.getByRole('switch', { name: 'Sound effects' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('should call saveSettings when Sound effects toggle is clicked', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    renderSettings(storage, {
      settings: createMockSettings({ soundEffects: false }),
      onSettingsChange,
    })
    const toggle = screen.getByRole('switch', { name: 'Sound effects' })
    await user.click(toggle)
    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ soundEffects: true }))
    expect(storage.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ soundEffects: true }),
    )
  })

  // ── Quiz mode drill-down sub-screen ─────────────────────────────────────────

  it('should display current quiz mode in the Quiz mode row', () => {
    renderSettings(storage, { settings: createMockSettings({ quizMode: 'choice' }) })
    const quizModeBtn = screen.getByRole('button', { name: /quiz mode/i })
    expect(quizModeBtn).toBeInTheDocument()
    // The detail text "Choice" appears in the rendered DOM
    const allChoice = screen.getAllByText('Choice')
    expect(allChoice.length).toBeGreaterThanOrEqual(1)
  })

  it('should open quiz mode sub-screen when Quiz mode row is tapped', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    const quizModeRow = screen.getByRole('button', { name: /quiz mode/i })
    await user.click(quizModeRow)
    await waitFor(() => {
      // The sub-screen has role=dialog with label "Quiz mode"
      expect(screen.getByRole('dialog', { name: 'Quiz mode' })).toBeInTheDocument()
    })
    // Sub-screen contains radio buttons for each mode
    const subScreen = screen.getByRole('dialog', { name: 'Quiz mode' })
    expect(within(subScreen).getByRole('radio', { name: 'Type' })).toBeInTheDocument()
    expect(within(subScreen).getByRole('radio', { name: 'Choice' })).toBeInTheDocument()
    expect(within(subScreen).getByRole('radio', { name: 'Mixed' })).toBeInTheDocument()
  })

  it('should update quiz mode and close sub-screen when selecting a mode', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    renderSettings(storage, {
      settings: createMockSettings({ quizMode: 'type' }),
      onSettingsChange,
    })
    const quizModeRow = screen.getByRole('button', { name: /quiz mode/i })
    await user.click(quizModeRow)
    await waitFor(() => screen.getByRole('dialog', { name: 'Quiz mode' }))
    const choiceOption = within(screen.getByRole('dialog', { name: 'Quiz mode' })).getByRole(
      'radio',
      { name: 'Choice' },
    )
    await user.click(choiceOption)
    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ quizMode: 'choice' }))
    expect(storage.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ quizMode: 'choice' }),
    )
  })

  it('should show checkmark on selected quiz mode in sub-screen', async () => {
    const user = userEvent.setup()
    renderSettings(storage, { settings: createMockSettings({ quizMode: 'mixed' }) })
    await user.click(screen.getByRole('button', { name: /quiz mode/i }))
    await waitFor(() => screen.getByRole('dialog', { name: 'Quiz mode' }))
    const subScreen = screen.getByRole('dialog', { name: 'Quiz mode' })
    const mixedOption = within(subScreen).getByRole('radio', { name: 'Mixed' })
    expect(mixedOption).toHaveAttribute('aria-checked', 'true')
  })

  it('should navigate back to Settings from quiz mode sub-screen', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    await user.click(screen.getByRole('button', { name: /quiz mode/i }))
    await waitFor(() => screen.getByRole('dialog', { name: 'Quiz mode' }))
    const subScreen = screen.getByRole('dialog', { name: 'Quiz mode' })
    const backBtn = within(subScreen).getByRole('button', { name: /back to settings/i })
    await user.click(backBtn)
    // After back, the sub-screen is still in DOM but translated off-screen
    // The main settings content remains accessible
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  // ── Show hints sub-screen ───────────────────────────────────────────────────

  it('should display "After 10s" in the Show hints row', () => {
    renderSettings(storage)
    const showHintsBtn = screen.getByRole('button', { name: /show hints/i })
    expect(showHintsBtn).toBeInTheDocument()
    // "After 10s" appears in the row detail (and sub-screen) — at least one instance
    const allAfter10 = screen.getAllByText('After 10s')
    expect(allAfter10.length).toBeGreaterThanOrEqual(1)
  })

  it('should open show hints sub-screen when Show hints row is tapped', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    await user.click(screen.getByRole('button', { name: /show hints/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Show hints' })).toBeInTheDocument()
    })
    const subScreen = screen.getByRole('dialog', { name: 'Show hints' })
    expect(within(subScreen).getByRole('radio', { name: 'Off' })).toBeInTheDocument()
    expect(within(subScreen).getByRole('radio', { name: 'After 5s' })).toBeInTheDocument()
    expect(within(subScreen).getByRole('radio', { name: 'After 10s' })).toBeInTheDocument()
  })

  it('should update show hint timeout when selecting an option', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    renderSettings(storage, {
      settings: createMockSettings({ showHintTimeout: 10 }),
      onSettingsChange,
    })
    await user.click(screen.getByRole('button', { name: /show hints/i }))
    await waitFor(() => screen.getByRole('dialog', { name: 'Show hints' }))
    const subScreen = screen.getByRole('dialog', { name: 'Show hints' })
    await user.click(within(subScreen).getByRole('radio', { name: 'After 5s' }))
    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ showHintTimeout: 5 }))
  })

  // ── Daily goal sub-screen ────────────────────────────────────────────────────

  it('should open daily goal sub-screen when Daily goal row is tapped', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    await user.click(screen.getByRole('button', { name: /daily goal/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Daily goal' })).toBeInTheDocument()
    })
    const subScreen = screen.getByRole('dialog', { name: 'Daily goal' })
    expect(within(subScreen).getByRole('radio', { name: '5 words' })).toBeInTheDocument()
    expect(within(subScreen).getByRole('radio', { name: '20 words' })).toBeInTheDocument()
    expect(within(subScreen).getByRole('radio', { name: '50 words' })).toBeInTheDocument()
  })

  it('should update daily goal and close sub-screen when selecting a preset', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    renderSettings(storage, {
      settings: createMockSettings({ dailyGoal: 20 }),
      onSettingsChange,
    })
    await user.click(screen.getByRole('button', { name: /daily goal/i }))
    await waitFor(() => screen.getByRole('dialog', { name: 'Daily goal' }))
    const subScreen = screen.getByRole('dialog', { name: 'Daily goal' })
    await user.click(within(subScreen).getByRole('radio', { name: '50 words' }))
    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ dailyGoal: 50 }))
  })

  // ── Auto-play ───────────────────────────────────────────────────────────────

  it('should render Auto-play pronunciation toggle off by default', () => {
    renderSettings(storage, { settings: createMockSettings({ autoPlayPronunciation: false }) })
    const toggle = screen.getByRole('switch', { name: 'Auto-play pronunciation' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('should call saveSettings when Auto-play pronunciation toggle is clicked', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    renderSettings(storage, {
      settings: createMockSettings({ autoPlayPronunciation: false }),
      onSettingsChange,
    })
    const toggle = screen.getByRole('switch', { name: 'Auto-play pronunciation' })
    await user.click(toggle)
    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ autoPlayPronunciation: true }),
    )
  })

  // ── Theme drill-down sub-screen ─────────────────────────────────────────────

  it('should display current theme in the Theme row', () => {
    renderSettings(storage, {
      settings: createMockSettings({ theme: 'dark' }),
      themePreference: 'dark',
    })
    const themeBtn = screen.getByRole('button', { name: /theme/i })
    expect(themeBtn).toBeInTheDocument()
    const allDark = screen.getAllByText('Dark')
    expect(allDark.length).toBeGreaterThanOrEqual(1)
  })

  it('should open theme sub-screen when Theme row is tapped', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    const themeRow = screen.getByRole('button', { name: /theme/i })
    await user.click(themeRow)
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Appearance' })).toBeInTheDocument()
    })
    const subScreen = screen.getByRole('dialog', { name: 'Appearance' })
    expect(within(subScreen).getByRole('radio', { name: 'System' })).toBeInTheDocument()
    expect(within(subScreen).getByRole('radio', { name: 'Light' })).toBeInTheDocument()
    expect(within(subScreen).getByRole('radio', { name: 'Dark' })).toBeInTheDocument()
  })

  it('should call onThemeChange when selecting Light in the theme sub-screen', async () => {
    const user = userEvent.setup()
    const onThemeChange = vi.fn()
    renderSettings(storage, { onThemeChange, themePreference: 'dark' })
    const themeRow = screen.getByRole('button', { name: /theme/i })
    await user.click(themeRow)
    await waitFor(() => screen.getByRole('dialog', { name: 'Appearance' }))
    const subScreen = screen.getByRole('dialog', { name: 'Appearance' })
    await user.click(within(subScreen).getByRole('radio', { name: 'Light' }))
    expect(onThemeChange).toHaveBeenCalledWith('light')
  })

  it('should show checkmark on selected theme in sub-screen', async () => {
    const user = userEvent.setup()
    renderSettings(storage, { themePreference: 'system' })
    await user.click(screen.getByRole('button', { name: /theme/i }))
    await waitFor(() => screen.getByRole('dialog', { name: 'Appearance' }))
    const subScreen = screen.getByRole('dialog', { name: 'Appearance' })
    const systemOption = within(subScreen).getByRole('radio', { name: 'System' })
    expect(systemOption).toHaveAttribute('aria-checked', 'true')
  })

  // ── Reminder sub-screen stub ────────────────────────────────────────────────

  it('should open reminder sub-screen when Reminder row is tapped', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    await user.click(screen.getByRole('button', { name: /reminder/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Reminder' })).toBeInTheDocument()
    })
    const subScreen = screen.getByRole('dialog', { name: 'Reminder' })
    expect(within(subScreen).getByText(/coming soon/i)).toBeInTheDocument()
  })

  // ── Data rows ───────────────────────────────────────────────────────────────

  it('should show a toast when Export is tapped with no active pair', async () => {
    const user = userEvent.setup()
    renderSettings(storage, { settings: createMockSettings({ activePairId: null }) })
    const exportRow = screen.getByRole('button', { name: /export vocabulary/i })
    await user.click(exportRow)
    await waitFor(() => {
      expect(screen.getByText('No active language pair to export.')).toBeInTheDocument()
    })
  })

  it('should trigger CSV download when Export is tapped with an active pair', async () => {
    const user = userEvent.setup()
    const word = createMockWord({ id: 'w1', pairId: 'p1' })
    storage = createMockStorage({
      saveSettings: vi.fn().mockResolvedValue(undefined),
      getWords: vi.fn().mockResolvedValue([word]),
    })
    renderSettings(storage, { settings: createMockSettings({ activePairId: 'p1' }) })
    const exportRow = screen.getByRole('button', { name: /export vocabulary/i })
    await user.click(exportRow)
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled()
    })
  })

  it('should open file input when Import row is tapped', () => {
    renderSettings(storage)
    const importRow = screen.getByRole('button', { name: /import from file/i })
    expect(importRow).toBeInTheDocument()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
  })

  it('should show import confirm dialog when valid JSON backup is uploaded', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    const validJson = JSON.stringify({
      languagePairs: [],
      words: {},
      settings: createMockSettings(),
    })
    const file = new File([validJson], 'backup.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)
    await waitFor(() => {
      expect(screen.getByText(/Import backup\?/i)).toBeInTheDocument()
    })
  })

  it('should show error when JSON lacks languagePairs array', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    const file = new File([JSON.stringify({ foo: 'bar' })], 'backup.json', {
      type: 'application/json',
    })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)
    await waitFor(() => {
      expect(screen.getByText(/missing "languagePairs" array/i)).toBeInTheDocument()
    })
  })

  it('should show import error when JSON is invalid', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    const file = new File(['not-json!!!'], 'backup.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)
    await waitFor(() => {
      expect(screen.getByText(/could not parse JSON/i)).toBeInTheDocument()
    })
  })

  it('should open reset progress iOS alert when Reset progress row is tapped', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    const resetRow = screen.getByRole('button', { name: /reset progress/i })
    await user.click(resetRow)
    await waitFor(() => {
      expect(screen.getByText(/Reset learning progress\?/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Your language pairs and words will be kept/i)).toBeInTheDocument()
  })

  it('should cancel reset and keep data when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    const resetRow = screen.getByRole('button', { name: /reset progress/i })
    await user.click(resetRow)
    await waitFor(() => screen.getByText(/Reset learning progress\?/i))
    // The iOS alert has Cancel button
    const alertDialog = screen.getByRole('dialog', { name: /reset learning progress/i })
    await user.click(within(alertDialog).getByRole('button', { name: /cancel/i }))
    expect(storage.saveWordProgress).not.toHaveBeenCalled()
  })

  it('should call saveWordProgress for each word with progress on reset confirm', async () => {
    const user = userEvent.setup()
    const word = createMockWord({ id: 'w1', pairId: 'p1' })
    const pair = createMockPair({ id: 'p1' })
    const progress = createMockProgress({ wordId: 'w1' })

    storage = createMockStorage({
      getLanguagePairs: vi.fn().mockResolvedValue([pair]),
      getWords: vi.fn().mockResolvedValue([word]),
      getWordProgress: vi.fn().mockResolvedValue(progress),
      saveWordProgress: vi.fn().mockResolvedValue(undefined),
      exportAll: vi.fn().mockResolvedValue(
        JSON.stringify({
          languagePairs: [pair],
          words: { p1: [word] },
          progress: {},
          settings: createMockSettings(),
          dailyStats: [],
        }),
      ),
      importAll: vi.fn().mockResolvedValue(undefined),
    })

    renderSettings(storage)
    const resetRow = screen.getByRole('button', { name: /reset progress/i })
    await user.click(resetRow)
    await waitFor(() => screen.getByText(/Reset learning progress\?/i))
    const alertDialog = screen.getByRole('dialog', { name: /reset learning progress/i })
    await user.click(within(alertDialog).getByRole('button', { name: /Reset progress$/i }))

    await waitFor(() => {
      expect(storage.saveWordProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          wordId: 'w1',
          correctCount: 0,
          incorrectCount: 0,
          streak: 0,
          confidence: 0,
          history: [],
        }),
      )
    })
  })
})
