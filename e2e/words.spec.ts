/**
 * E2E tests for word CRUD operations.
 *
 * Covers the add and edit flows to ensure the form dialogs, the word list,
 * and the underlying storage all work end-to-end.
 *
 * Note: The Library screen (issue #149 Liquid Glass redesign) replaced the
 * old WordListScreen. The new UI uses GlassRow for word items — tapping a row
 * opens the edit dialog. Delete is accessible only through the edit dialog's
 * delete flow. This test covers add + edit via the new Library UI.
 *
 * Onboarding is bypassed via localStorage pre-population. See
 * `onboarding.spec.ts` for the onboarding wizard tests.
 */

import { test, expect } from '@playwright/test'
import { resetAndBypassOnboarding, navigateTo } from './helpers'

// ─── Test setup ───────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await resetAndBypassOnboarding(page)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

test('add and view a word in the Library', async ({ page }) => {
  // ── Setup: navigate to Words tab ─────────────────────────────────────────
  // The EN-LV pair is already active (injected via bypassOnboarding).
  await navigateTo(page, 'Words')
  await expect(page.getByText('No words yet')).toBeVisible()

  // ── Add a word via the plus button in the NavBar ─────────────────────────
  // The Library NavBar has an "Add word" button in the trailing slot.
  // This opens the new AddWordModal (#150 Liquid Glass redesign).
  await page.getByRole('button', { name: 'Add word' }).first().click()

  await expect(page.getByRole('dialog')).toBeVisible()
  // AddWordModal title is "New Word" (not "Add word")
  await expect(page.getByRole('heading', { name: 'New Word' })).toBeVisible()

  // Term input is labelled "Term in en" (using fromCode)
  await page.getByRole('textbox', { name: /term in en/i }).fill('hello')
  // Meaning input is labelled "Meaning in lv" (using toCode)
  await page.getByRole('textbox', { name: /meaning in lv/i }).fill('sveiki')

  // Submit using the "Save" button in the nav row (not "Add word").
  await page.getByRole('button', { name: 'Save new word' }).click()

  // Dialog should close.
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })

  // The word should appear in the Library list.
  await expect(page.getByText('hello')).toBeVisible()
  await expect(page.getByText('sveiki')).toBeVisible()

  // ── Edit the word via row tap ─────────────────────────────────────────────
  // In the new Library UI, tapping a word row opens the edit/detail dialog.
  await page.getByText('hello').click()

  // The Edit Word dialog should open pre-filled with the current values.
  await expect(page.getByText('Edit word')).toBeVisible()
  await expect(page.getByLabel('Target word')).toHaveValue('sveiki')

  // Update the target word.
  await page.getByLabel('Target word').fill('čau')

  await page.getByRole('button', { name: /save/i }).first().click()

  // Dialog should close.
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })

  // The updated value should be shown.
  await expect(page.getByText('čau')).toBeVisible()
  await expect(page.getByText('sveiki')).toBeHidden()
})
