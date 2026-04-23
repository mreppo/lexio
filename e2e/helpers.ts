/**
 * Shared helpers for Lexio E2E tests.
 *
 * Every test clears localStorage before running so tests are isolated and
 * order-independent. Helpers here cover the common operations (bypassing
 * onboarding, navigating via BottomNav, creating a language pair, installing
 * a starter pack, adding a word) so each test file stays concise.
 *
 * ## Onboarding strategy
 *
 * The onboarding wizard (#70) blocks the main app UI when no language pairs
 * exist in localStorage. Most tests use `bypassOnboarding()` (Option B from
 * the issue) to pre-populate localStorage before the app loads, which is
 * fast and avoids coupling every test to the onboarding UX.
 *
 * The dedicated `e2e/onboarding.spec.ts` file tests the wizard end-to-end.
 *
 * ## Navigation
 *
 * The app now uses a BottomNav (five tabs: Home, Quiz, Words, Stats, Settings).
 * Navigation actions have `aria-label="Navigate to <Tab>"` applied by the
 * BottomNavigation component. Use `navigateTo()` instead of clicking tabs
 * directly to keep all navigation in one place.
 */

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

// ─── localStorage keys (must match LocalStorageService.ts) ────────────────────

const STORAGE_KEYS = {
  LANGUAGE_PAIRS: 'lexio:language-pairs',
  SETTINGS: 'lexio:settings',
} as const

// ─── State reset ─────────────────────────────────────────────────────────────

/**
 * Clears all application state stored in localStorage and navigates to the
 * app root. Call this in every `beforeEach`.
 *
 * After calling this function the app will show the onboarding wizard because
 * no language pairs exist. Use `bypassOnboarding()` to skip the wizard for
 * tests that do not cover the onboarding flow.
 */
export async function resetAppState(page: Page): Promise<void> {
  await page.goto('/#/app')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

// ─── Onboarding bypass ────────────────────────────────────────────────────────

export interface BypassOnboardingOptions {
  /** Language pair to inject. Defaults to English → Latvian. */
  readonly pair?: {
    readonly id: string
    readonly sourceLang: string
    readonly sourceCode: string
    readonly targetLang: string
    readonly targetCode: string
  }
}

/**
 * Pre-populates localStorage with a language pair so the onboarding wizard
 * does not appear. Call this immediately after `resetAppState()` (before the
 * page reloads) or use `resetAndBypassOnboarding()` for convenience.
 *
 * This is intentionally not using the app's own API — the goal is to set up
 * test state as quickly as possible without relying on any UI interaction.
 *
 * Both `lexio:language-pairs` and `lexio:settings` are written so that
 * `activePairId` is set and `useLanguagePairs` resolves the active pair.
 */
export async function bypassOnboarding(
  page: Page,
  options: BypassOnboardingOptions = {},
): Promise<void> {
  const pair = options.pair ?? {
    id: 'test-pair-id',
    sourceLang: 'English',
    sourceCode: 'en',
    targetLang: 'Latvian',
    targetCode: 'lv',
    createdAt: Date.now(),
  }

  await page.evaluate(
    ({
      pairsKey,
      pairsValue,
      settingsKey,
      settingsValue,
    }: {
      pairsKey: string
      pairsValue: string
      settingsKey: string
      settingsValue: string
    }) => {
      localStorage.setItem(pairsKey, pairsValue)
      localStorage.setItem(settingsKey, settingsValue)
    },
    {
      pairsKey: STORAGE_KEYS.LANGUAGE_PAIRS,
      pairsValue: JSON.stringify([pair]),
      settingsKey: STORAGE_KEYS.SETTINGS,
      settingsValue: JSON.stringify({
        activePairId: pair.id,
        quizMode: 'type',
        dailyGoal: 20,
        theme: 'dark',
        typoTolerance: 1,
      }),
    },
  )
  // Navigate to the app route (HashRouter) so the main app shell loads.
  await page.goto('/#/app')

  // Wait for the main app shell to be visible.
  // The home tab now shows a Liquid Glass NavBar with "Today" as the large title.
  // The legacy AppBar with "Lexio" is only shown on non-home tabs.
  await expect(page.getByText('Today').first()).toBeVisible({ timeout: 10_000 })
}

/**
 * Convenience helper: clears localStorage, injects a test language pair, and
 * waits for the main app to load. Use this as a drop-in replacement for
 * `resetAppState()` in tests that don't cover the onboarding flow.
 */
export async function resetAndBypassOnboarding(
  page: Page,
  options: BypassOnboardingOptions = {},
): Promise<void> {
  await page.goto('/#/app')
  await page.evaluate(() => localStorage.clear())
  await bypassOnboarding(page, options)
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type AppTab = 'Home' | 'Quiz' | 'Words' | 'Stats' | 'Settings'

/**
 * Navigates to a tab via the BottomNav.
 * The BottomNavigationAction has `aria-label="Navigate to <Tab>"`.
 *
 * Dismisses the PWA install banner if it is visible before clicking — the
 * banner is a Snackbar that can overlay the tab bar on the first few renders.
 */
export async function navigateTo(page: Page, tab: AppTab): Promise<void> {
  // Dismiss the install banner if it is blocking the tab bar.
  const dismissBtn = page.getByRole('button', { name: /dismiss|not now|close/i })
  if (await dismissBtn.isVisible()) {
    await dismissBtn.click()
  }
  await page.getByRole('button', { name: `Navigate to ${tab}` }).click()
}

// ─── Language pair creation ───────────────────────────────────────────────────

export interface PairInput {
  sourceLang: string
  sourceCode: string
  targetLang: string
  targetCode: string
}

/**
 * Fills an MUI Autocomplete freeSolo field by typing the value and clicking
 * the matching option that appears in the dropdown. This properly triggers the
 * Autocomplete `onChange` so React state is updated.
 *
 * The combo input is identified by its combobox role and the accessible name
 * matching the given label text.
 */
async function fillAutocompleteLanguage(
  page: Page,
  labelText: string,
  value: string,
): Promise<void> {
  // Target only the combobox input (not the listbox which also has the label).
  const input = page.getByRole('combobox', { name: labelText })
  await input.click()
  await input.fill(value)

  // Wait for the dropdown listbox to contain an option matching the typed text.
  const option = page.getByRole('option', { name: new RegExp(`^${value}`, 'i') }).first()
  await option.waitFor({ timeout: 5_000 })
  await option.click()
}

/**
 * Fills in the Create Pair dialog and submits it.
 * Caller must ensure the dialog is already open.
 */
export async function fillAndSubmitCreatePairDialog(page: Page, pair: PairInput): Promise<void> {
  // The form renders two Autocomplete + Language code field pairs.
  // Use role="combobox" to target only the inputs (not the listboxes).

  // Source language Autocomplete
  await fillAutocompleteLanguage(page, 'Source language', pair.sourceLang)

  // Source language code (first text field labelled "Language code")
  // After selecting a preset the code may already be filled; overwrite it.
  const langCodeFields = page.getByRole('textbox', { name: 'Language code' })
  await langCodeFields.first().fill(pair.sourceCode)

  // Target language Autocomplete
  await fillAutocompleteLanguage(page, 'Target language', pair.targetLang)

  // Target language code (second text field labelled "Language code")
  await langCodeFields.last().fill(pair.targetCode)

  await page.getByRole('button', { name: 'Create pair' }).click()

  // Wait for the dialog to close (the form submits successfully).
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 })
}

/**
 * Creates a language pair by injecting it directly into localStorage.
 *
 * After issue #152, the Settings screen was rebuilt as a full-bleed Liquid Glass
 * screen and the old AppBar language selector (which provided the "Add pair"
 * entry point) was retired. Direct localStorage injection is now the fastest and
 * most reliable approach for E2E test setup.
 *
 * The new pair is appended to the existing pairs list. The active pair is NOT
 * changed (the existing active pair remains active).
 *
 * After injection the page is reloaded so the app picks up the new pair.
 */
export async function createLanguagePair(page: Page, pair: PairInput): Promise<void> {
  const newPair = {
    id: `test-pair-${pair.sourceCode}-${pair.targetCode}-${Date.now()}`,
    sourceLang: pair.sourceLang,
    sourceCode: pair.sourceCode,
    targetLang: pair.targetLang,
    targetCode: pair.targetCode,
    createdAt: Date.now(),
  }

  await page.evaluate(
    ({ pairsKey, newPairJson }: { pairsKey: string; newPairJson: string }) => {
      const existing = JSON.parse(localStorage.getItem(pairsKey) ?? '[]') as unknown[]
      existing.push(JSON.parse(newPairJson))
      localStorage.setItem(pairsKey, JSON.stringify(existing))
    },
    {
      pairsKey: STORAGE_KEYS.LANGUAGE_PAIRS,
      newPairJson: JSON.stringify(newPair),
    },
  )

  // Reload so the app reads the updated localStorage.
  await page.reload()
  // Wait for the home screen to re-render.
  await expect(page.getByText('Today').first()).toBeVisible({ timeout: 10_000 })
}

/**
 * Creates a language pair and switches the active pair to it via localStorage.
 *
 * Equivalent to the old "Add pair via AppBar + switch via selector" flow but
 * uses localStorage injection instead of UI interaction (the AppBar selector
 * was retired in issue #152 when all screens moved to the Liquid Glass layout).
 *
 * After reload, the new pair is the active pair.
 */
export async function createLanguagePairAndSwitch(page: Page, pair: PairInput): Promise<void> {
  const newPair = {
    id: `test-pair-${pair.sourceCode}-${pair.targetCode}-${Date.now()}`,
    sourceLang: pair.sourceLang,
    sourceCode: pair.sourceCode,
    targetLang: pair.targetLang,
    targetCode: pair.targetCode,
    createdAt: Date.now(),
  }

  await page.evaluate(
    ({
      pairsKey,
      settingsKey,
      newPairJson,
    }: {
      pairsKey: string
      settingsKey: string
      newPairJson: string
    }) => {
      const parsed = JSON.parse(newPairJson) as { id: string }
      const existingPairs = JSON.parse(localStorage.getItem(pairsKey) ?? '[]') as unknown[]
      existingPairs.push(parsed)
      localStorage.setItem(pairsKey, JSON.stringify(existingPairs))

      // Update active pair in settings.
      const rawSettings = localStorage.getItem(settingsKey)
      const existingSettings = rawSettings ? (JSON.parse(rawSettings) as Record<string, unknown>) : {}
      existingSettings['activePairId'] = parsed.id
      localStorage.setItem(settingsKey, JSON.stringify(existingSettings))
    },
    {
      pairsKey: STORAGE_KEYS.LANGUAGE_PAIRS,
      settingsKey: STORAGE_KEYS.SETTINGS,
      newPairJson: JSON.stringify(newPair),
    },
  )

  await page.reload()
  await expect(page.getByText('Today').first()).toBeVisible({ timeout: 10_000 })
}

// ─── Starter pack installation ────────────────────────────────────────────────

/**
 * Navigates to the Words tab and clicks the "Starter packs" (or "Packs")
 * button to open the pack browser.
 */
export async function openPackBrowserFromWordsTab(page: Page): Promise<void> {
  await navigateTo(page, 'Words')
  // The button is labelled "Starter packs" in the empty state and "Packs" when
  // there are already words. Match both with a regex.
  const packsButton = page.getByRole('button', { name: /starter packs|packs/i }).first()
  await packsButton.click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
}

/**
 * Installs the first available starter pack and waits for the dialog to close.
 */
export async function installFirstAvailablePack(page: Page): Promise<void> {
  // Wait for at least one Install button to appear (packs have loaded).
  const installBtn = page.getByRole('button', { name: 'Install' }).first()
  await installBtn.waitFor({ timeout: 15_000 })
  await installBtn.click()
  // Dialog auto-closes after 1.5 s; wait up to 10 s.
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })
}

// ─── Word management ──────────────────────────────────────────────────────────

export interface WordInput {
  source: string
  target: string
}

/**
 * Opens the Add Word dialog from the Words tab and adds a word.
 * Assumes the Words tab is already active and the word list is visible.
 * Works for both the empty-state "Add your first word" button and the
 * populated-state "Add word" button.
 */
export async function addWord(page: Page, word: WordInput): Promise<void> {
  // "Add your first word" (empty) or "Add word" (populated)
  await page
    .getByRole('button', { name: /add (your first )?word/i })
    .first()
    .click()
  await page.getByLabel('Source word').fill(word.source)
  await page.getByLabel('Target word').fill(word.target)
  // The submit button inside the dialog is also "Add word"
  await page.getByRole('button', { name: 'Add word' }).last().click()
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })
}
