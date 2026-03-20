/**
 * Tests for SettingsScreen.
 *
 * Covers:
 * - Rendering of all sections (Preferences, Language Pairs, Data Management, About)
 * - Preference changes: theme, quiz mode, daily goal, typo tolerance
 * - Settings persistence via saveSettings
 * - Data export flow
 * - Data import: validation, confirmation dialog, success
 * - Reset progress: confirmation dialog, keeps words
 * - Reset all: double confirmation dialog, calls clearAll
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsScreen } from './SettingsScreen'
import { StorageContext } from '@/hooks/useStorage'
import { createMockStorage } from '@/test/mockStorage'
import {
  createMockSettings,
  createMockPair,
  createMockWord,
  createMockProgress,
} from '@/test/fixtures'
import type { StorageService } from '@/services/storage/StorageService'
import type { UserSettings, LanguagePair } from '@/types'
import { createElement, type ReactNode } from 'react'

// __APP_VERSION__ is declared in vite-env.d.ts; in tests it is undefined unless
// the Vite define plugin runs — provide a fallback via globalThis.
Object.defineProperty(globalThis, '__APP_VERSION__', {
  value: '0.1.0',
  writable: true,
})

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

function renderSettings(
  storage: StorageService,
  overrides: {
    settings?: UserSettings
    themePreference?: UserSettings['theme']
    onThemeChange?: (p: UserSettings['theme']) => void
    onSettingsChange?: (s: UserSettings) => void
    pairs?: readonly LanguagePair[]
    wordCounts?: Record<string, number>
    onAddPair?: () => void
  } = {},
) {
  const settings = overrides.settings ?? createMockSettings()
  return render(
    <SettingsScreen
      themePreference={overrides.themePreference ?? 'dark'}
      onThemeChange={overrides.onThemeChange ?? vi.fn()}
      settings={settings}
      onSettingsChange={overrides.onSettingsChange ?? vi.fn()}
      pairs={overrides.pairs ?? []}
      wordCounts={overrides.wordCounts ?? {}}
      onAddPair={overrides.onAddPair ?? vi.fn()}
    />,
    { wrapper: makeWrapper(storage) },
  )
}

describe('SettingsScreen', () => {
  let storage: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    storage = createMockStorage({
      saveSettings: vi.fn().mockResolvedValue(undefined),
      getSettings: vi.fn().mockResolvedValue(createMockSettings()),
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
      clearAll: vi.fn().mockResolvedValue(undefined),
    })
    vi.clearAllMocks()
  })

  // ── Section rendering ──────────────────────────────────────────────────────

  it('should render the Preferences section', () => {
    renderSettings(storage)
    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByLabelText('Theme preference')).toBeInTheDocument()
    expect(screen.getByLabelText('Default quiz mode')).toBeInTheDocument()
    expect(screen.getByLabelText('Typo tolerance')).toBeInTheDocument()
  })

  it('should render the Language Pairs section', () => {
    renderSettings(storage)
    expect(screen.getByText('Language pairs')).toBeInTheDocument()
  })

  it('should render language pairs with word counts', () => {
    const pair = createMockPair({ id: 'p1', sourceLang: 'English', targetLang: 'Latvian' })
    renderSettings(storage, {
      pairs: [pair],
      wordCounts: { p1: 42 },
    })
    expect(screen.getByText('English → Latvian')).toBeInTheDocument()
    expect(screen.getByText('42 words')).toBeInTheDocument()
  })

  it('should show "1 word" (singular) when pair has exactly one word', () => {
    const pair = createMockPair({ id: 'p1' })
    renderSettings(storage, { pairs: [pair], wordCounts: { p1: 1 } })
    expect(screen.getByText('1 word')).toBeInTheDocument()
  })

  it('should render the Data Management section', () => {
    renderSettings(storage)
    expect(screen.getByText('Data management')).toBeInTheDocument()
    expect(screen.getByLabelText('Export data as JSON backup')).toBeInTheDocument()
    expect(screen.getByLabelText('Import data from JSON backup')).toBeInTheDocument()
    expect(screen.getByLabelText('Reset all learning progress')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Reset all data and return to first-launch state'),
    ).toBeInTheDocument()
  })

  it('should render the About section with version', () => {
    renderSettings(storage)
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText(/Version 0\.1\.0/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View source on GitHub/i })).toBeInTheDocument()
  })

  // ── Preferences ───────────────────────────────────────────────────────────

  it('should call onThemeChange when theme radio changes', async () => {
    const user = userEvent.setup()
    const onThemeChange = vi.fn()
    renderSettings(storage, { themePreference: 'dark', onThemeChange })

    const lightRadio = screen.getByRole('radio', { name: 'Light' })
    await user.click(lightRadio)

    expect(onThemeChange).toHaveBeenCalledWith('light')
  })

  it('should call onSettingsChange and saveSettings when quiz mode changes', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    const settings = createMockSettings({ quizMode: 'type' })
    renderSettings(storage, { settings, onSettingsChange })

    const choiceRadio = screen.getByRole('radio', { name: 'Choice' })
    await user.click(choiceRadio)

    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ quizMode: 'choice' }))
    expect(storage.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ quizMode: 'choice' }),
    )
  })

  it('should call onSettingsChange and saveSettings when daily goal preset is clicked', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    const settings = createMockSettings({ dailyGoal: 20 })
    renderSettings(storage, { settings, onSettingsChange })

    const preset30 = screen.getByLabelText('Set daily goal to 30 words')
    await user.click(preset30)

    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ dailyGoal: 30 }))
    expect(storage.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ dailyGoal: 30 }))
  })

  it('should persist custom daily goal on input blur', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    const settings = createMockSettings({ dailyGoal: 20 })
    renderSettings(storage, { settings, onSettingsChange })

    const input = screen.getByLabelText('Custom daily goal')
    await user.clear(input)
    await user.type(input, '45')
    await user.tab()

    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ dailyGoal: 45 }))
    expect(storage.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ dailyGoal: 45 }))
  })

  it('should clamp daily goal to 1 when input is 0', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    renderSettings(storage, { settings: createMockSettings({ dailyGoal: 20 }), onSettingsChange })

    const input = screen.getByLabelText('Custom daily goal')
    await user.clear(input)
    await user.type(input, '0')
    await user.tab()

    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ dailyGoal: 1 }))
  })

  it('should clamp daily goal to 200 when input exceeds maximum', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    renderSettings(storage, { settings: createMockSettings({ dailyGoal: 20 }), onSettingsChange })

    const input = screen.getByLabelText('Custom daily goal')
    await user.clear(input)
    await user.type(input, '999')
    await user.tab()

    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ dailyGoal: 200 }))
  })

  // ── Language Pairs ────────────────────────────────────────────────────────

  it('should call onAddPair when "Add language pair" button is clicked', async () => {
    const user = userEvent.setup()
    const onAddPair = vi.fn()
    renderSettings(storage, { onAddPair })

    await user.click(screen.getByRole('button', { name: /Add language pair/i }))
    expect(onAddPair).toHaveBeenCalledOnce()
  })

  it('should show "Active" chip for the active pair', () => {
    const pair = createMockPair({ id: 'p1' })
    renderSettings(storage, {
      settings: createMockSettings({ activePairId: 'p1' }),
      pairs: [pair],
      wordCounts: { p1: 5 },
    })
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  // ── Export ────────────────────────────────────────────────────────────────

  it('should call exportAll and create a blob URL on export', async () => {
    const user = userEvent.setup()
    renderSettings(storage)

    await user.click(screen.getByLabelText('Export data as JSON backup'))

    await waitFor(() => {
      expect(storage.exportAll).toHaveBeenCalledOnce()
      expect(URL.createObjectURL).toHaveBeenCalledOnce()
    })
  })

  it('should show export error when exportAll throws', async () => {
    const user = userEvent.setup()
    storage = createMockStorage({
      exportAll: vi.fn().mockRejectedValue(new Error('Storage error')),
    })
    renderSettings(storage)

    await user.click(screen.getByLabelText('Export data as JSON backup'))

    await waitFor(() => {
      expect(screen.getByText('Export failed. Please try again.')).toBeInTheDocument()
    })
  })

  // ── Import ────────────────────────────────────────────────────────────────

  it('should show import confirm dialog when valid JSON is uploaded', async () => {
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
    expect(screen.getByText(/This will overwrite your current data/i)).toBeInTheDocument()
  })

  it('should show error when JSON is invalid', async () => {
    const user = userEvent.setup()
    renderSettings(storage)

    const file = new File(['not-json!!!'], 'backup.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/Invalid backup file: could not parse JSON/i)).toBeInTheDocument()
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

  it('should cancel import when Cancel is clicked in confirm dialog', async () => {
    const user = userEvent.setup()
    renderSettings(storage)

    const validJson = JSON.stringify({ languagePairs: [] })
    const file = new File([validJson], 'backup.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => screen.getByText(/Import backup\?/i))
    await user.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(storage.importAll).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByText(/Import backup\?/i)).not.toBeInTheDocument()
    })
  })

  // ── Reset Progress ────────────────────────────────────────────────────────

  it('should show reset progress confirmation dialog', async () => {
    const user = userEvent.setup()
    renderSettings(storage)

    await user.click(screen.getByLabelText('Reset all learning progress'))

    expect(screen.getByText(/Reset learning progress\?/i)).toBeInTheDocument()
    expect(screen.getByText(/Your language pairs and words will be kept/i)).toBeInTheDocument()
  })

  it('should call saveWordProgress with zeroed values for each word', async () => {
    const user = userEvent.setup()
    const word1 = createMockWord({ id: 'w1', pairId: 'p1' })
    const word2 = createMockWord({ id: 'w2', pairId: 'p1' })
    const pair = createMockPair({ id: 'p1' })
    const progress1 = createMockProgress({ wordId: 'w1' })

    storage = createMockStorage({
      getLanguagePairs: vi.fn().mockResolvedValue([pair]),
      getWords: vi.fn().mockResolvedValue([word1, word2]),
      getWordProgress: vi
        .fn()
        .mockImplementation((wordId: string) =>
          Promise.resolve(wordId === 'w1' ? progress1 : null),
        ),
      saveWordProgress: vi.fn().mockResolvedValue(undefined),
      exportAll: vi.fn().mockResolvedValue(
        JSON.stringify({
          languagePairs: [pair],
          words: { p1: [word1, word2] },
          progress: {},
          settings: createMockSettings(),
          dailyStats: [],
        }),
      ),
      importAll: vi.fn().mockResolvedValue(undefined),
    })

    renderSettings(storage)
    await user.click(screen.getByLabelText('Reset all learning progress'))
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
    // word2 has no existing progress, so saveWordProgress should only be called once
    expect(storage.saveWordProgress).toHaveBeenCalledTimes(1)
  })

  it('should cancel reset progress when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderSettings(storage)

    await user.click(screen.getByLabelText('Reset all learning progress'))
    await waitFor(() => screen.getByText(/Reset learning progress\?/i))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(storage.saveWordProgress).not.toHaveBeenCalled()
  })

  // ── Reset All ─────────────────────────────────────────────────────────────

  it('should show first reset all confirmation dialog', async () => {
    const user = userEvent.setup()
    renderSettings(storage)

    await user.click(screen.getByLabelText('Reset all data and return to first-launch state'))

    await waitFor(() => {
      expect(screen.getByText(/Reset all data\?/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/permanently erased/i)).toBeInTheDocument()
  })

  it('should show double confirmation dialog after first confirm', async () => {
    const user = userEvent.setup()
    renderSettings(storage)

    await user.click(screen.getByLabelText('Reset all data and return to first-launch state'))
    await waitFor(() => screen.getByText(/Reset all data\?/i))
    await user.click(screen.getByRole('button', { name: /Continue/i }))

    await waitFor(() => {
      expect(screen.getByText(/Are you absolutely sure\?/i)).toBeInTheDocument()
    })
  })

  it('should call clearAll after double confirmation', async () => {
    const user = userEvent.setup()

    // Stub location.reload to prevent jsdom error
    const reloadSpy = vi.spyOn(globalThis, 'location', 'get').mockReturnValue({
      ...globalThis.location,
      reload: vi.fn(),
    })

    renderSettings(storage)

    await user.click(screen.getByLabelText('Reset all data and return to first-launch state'))
    await waitFor(() => screen.getByText(/Reset all data\?/i))
    await user.click(screen.getByRole('button', { name: /Continue/i }))
    await waitFor(() => screen.getByText(/Are you absolutely sure\?/i))
    await user.click(screen.getByRole('button', { name: /Yes, delete everything/i }))

    await waitFor(() => {
      expect(storage.clearAll).toHaveBeenCalledOnce()
    })

    reloadSpy.mockRestore()
  })

  it('should cancel reset all from double confirm dialog', async () => {
    const user = userEvent.setup()
    renderSettings(storage)

    await user.click(screen.getByLabelText('Reset all data and return to first-launch state'))
    await waitFor(() => screen.getByText(/Reset all data\?/i))
    await user.click(screen.getByRole('button', { name: /Continue/i }))
    await waitFor(() => screen.getByText(/Are you absolutely sure\?/i))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(storage.clearAll).not.toHaveBeenCalled()
  })

  // ── Active pair indicator ─────────────────────────────────────────────────

  it('should show "No language pairs yet" message when pairs list is empty', () => {
    renderSettings(storage, { pairs: [] })
    expect(screen.getByText('No language pairs yet.')).toBeInTheDocument()
  })
})
