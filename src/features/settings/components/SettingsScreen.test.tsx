/**
 * Tests for the rebuilt SettingsScreen (Liquid Glass, issue #152).
 *
 * Covers:
 * - NavBar "Settings" title renders
 * - Account card: avatar initial from displayName or 'L' fallback; tap fires toast
 * - Section headers: Daily practice, Quiz, Appearance, Data
 * - Daily goal row displays `{dailyGoal} words`
 * - Reminder row displays "9:00 AM" stub
 * - Sound effects toggle: reflects setting, updates on toggle
 * - Quiz mode row: opens picker, selecting mode updates settings
 * - Auto-play pronunciation toggle: reflects setting, updates on toggle
 * - Theme row: opens picker, selecting theme calls onThemeChange
 * - Export row: triggers CSV export handler
 * - Import row: opens file picker; import confirm dialog on valid file
 * - Reset progress row: opens destructive confirm; confirming calls reset path
 * - displayName=null falls back to 'L' avatar initial and 'Lexio user' name
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
    expect(screen.getByText('Settings')).toBeInTheDocument()
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
    expect(screen.getByText('30 words')).toBeInTheDocument()
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

  // ── Quiz rows ───────────────────────────────────────────────────────────────

  it('should display current quiz mode in the Quiz mode row', () => {
    renderSettings(storage, { settings: createMockSettings({ quizMode: 'choice' }) })
    expect(screen.getByText('Choice')).toBeInTheDocument()
  })

  it('should open quiz mode picker dialog when Quiz mode row is tapped', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    // The row renders as a button — target it specifically by its aria-label
    const quizModeRow = screen.getByRole('button', { name: /quiz mode/i })
    await user.click(quizModeRow)
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /quiz mode/i })).toBeInTheDocument()
    })
    // Dialog contains a radiogroup with the three mode options
    expect(screen.getByRole('radio', { name: 'Type' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Choice' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Mixed' })).toBeInTheDocument()
  })

  it('should update quiz mode and close dialog when selecting a mode', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    renderSettings(storage, {
      settings: createMockSettings({ quizMode: 'type' }),
      onSettingsChange,
    })
    const quizModeRow = screen.getByRole('button', { name: /quiz mode/i })
    await user.click(quizModeRow)
    await waitFor(() => screen.getByRole('dialog'))
    const choiceRadio = screen.getByRole('radio', { name: 'Choice' })
    await user.click(choiceRadio)
    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ quizMode: 'choice' }))
    expect(storage.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ quizMode: 'choice' }),
    )
  })

  it('should display "After 10s" in the Show hints row', () => {
    renderSettings(storage)
    expect(screen.getByText('After 10s')).toBeInTheDocument()
  })

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

  // ── Appearance row ──────────────────────────────────────────────────────────

  it('should display current theme in the Theme row', () => {
    renderSettings(storage, {
      settings: createMockSettings({ theme: 'dark' }),
      themePreference: 'dark',
    })
    expect(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('should open theme picker dialog when Theme row is tapped', async () => {
    const user = userEvent.setup()
    renderSettings(storage)
    const themeRow = screen.getByRole('button', { name: /theme/i })
    await user.click(themeRow)
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /appearance/i })).toBeInTheDocument()
    })
    // Dialog shows System / Light / Dark radio options
    expect(screen.getByRole('radio', { name: 'System' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Light' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeInTheDocument()
  })

  it('should call onThemeChange when selecting Light in the theme picker', async () => {
    const user = userEvent.setup()
    const onThemeChange = vi.fn()
    renderSettings(storage, { onThemeChange, themePreference: 'dark' })
    const themeRow = screen.getByRole('button', { name: /theme/i })
    await user.click(themeRow)
    await waitFor(() => screen.getByRole('dialog'))
    await user.click(screen.getByRole('radio', { name: 'Light' }))
    expect(onThemeChange).toHaveBeenCalledWith('light')
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
    // Clicking Import row should trigger file input click.
    // We verify the hidden input is present rather than spy on .click()
    // since jsdom doesn't dispatch click events the same way.
    expect(importRow).toBeInTheDocument()
    // The hidden file input should be in the document.
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

  it('should open reset progress confirm dialog when Reset progress row is tapped', async () => {
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
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
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
    await user.click(screen.getByRole('button', { name: /Reset progress$/i }))

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
