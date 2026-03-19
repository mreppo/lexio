/**
 * Shared helpers for Lexio E2E tests.
 *
 * Every test clears localStorage before running so tests are isolated and
 * order-independent. Helpers here cover the common operations (creating a
 * language pair, installing a starter pack, adding a word) so each test file
 * stays concise.
 */

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

// ─── State reset ─────────────────────────────────────────────────────────────

/**
 * Clears all application state stored in localStorage and navigates to the
 * app root. Call this in every `beforeEach`.
 */
export async function resetAppState(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
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
 * Opens the Create Pair dialog from the toolbar language selector's
 * "Add pair" menu item, then fills and submits the form.
 */
export async function createLanguagePair(page: Page, pair: PairInput): Promise<void> {
  // Open the language pair selector dropdown in the AppBar.
  await page.getByRole('button', { name: 'Select language pair' }).click()
  // Click the "Add pair" menu item.
  await page.getByRole('menuitem', { name: 'Add pair' }).click()
  await fillAndSubmitCreatePairDialog(page, pair)
}

// ─── Starter pack installation ────────────────────────────────────────────────

/**
 * Navigates to the Words tab and clicks the "Starter packs" (or "Packs")
 * button to open the pack browser.
 */
export async function openPackBrowserFromWordsTab(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Words' }).click()
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
