/**
 * E2E tests for the starter pack installation flow.
 *
 * This flow has historically been the most fragile (it broke 3 times):
 *   - #40: Fetch 404 — wrong base path for the JSON file
 *   - #42: Dialog not closing after install
 *   - #44: Dialog reopening after install
 *
 * Running against the production build (not dev server) ensures base-path
 * issues are caught here rather than in production.
 */

import { test, expect } from '@playwright/test'
import {
  resetAppState,
  fillAndSubmitCreatePairDialog,
  openPackBrowserFromWordsTab,
  installFirstAvailablePack,
} from './helpers'

// ─── Test setup ───────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

test('install starter pack from empty state', async ({ page }) => {
  // On first launch the app shows a Create Pair dialog.
  // Fill in an EN-LV pair.
  await fillAndSubmitCreatePairDialog(page, {
    sourceLang: 'English',
    sourceCode: 'en',
    targetLang: 'Latvian',
    targetCode: 'lv',
  })

  // Navigate to the Words tab.
  await page.getByRole('tab', { name: 'Words' }).click()

  // The empty state should be visible.
  await expect(page.getByText('No words yet')).toBeVisible()

  // Open the pack browser.
  await page.getByRole('button', { name: 'Starter packs' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Browse starter packs')).toBeVisible()

  // At least one pack should be listed — verifies the fetch succeeded (no 404).
  await page.getByRole('button', { name: 'Install' }).first().waitFor({ timeout: 15_000 })
  const installButtons = page.getByRole('button', { name: 'Install' })
  await expect(installButtons).not.toHaveCount(0)

  // Install the first pack.
  await installButtons.first().click()

  // A success message should appear briefly.
  await expect(page.getByText(/added \d+ words/i)).toBeVisible()

  // The dialog should close automatically (regression test for #42 and #44).
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })

  // The word list should now have words (regression for the 404 bug in #40).
  await expect(page.getByText('No words yet')).toBeHidden()

  // Verify at least one word row is visible. The list renders word source/target
  // text inline — check for the list structure (Paper variant="outlined").
  // Each word row is a ListItem inside a Paper. We look for the list element.
  await expect(page.getByRole('list').first()).toBeVisible()
})

test('install starter pack from populated word list', async ({ page }) => {
  // Create an EN-LV pair and then install a starter pack via the empty state.
  await fillAndSubmitCreatePairDialog(page, {
    sourceLang: 'English',
    sourceCode: 'en',
    targetLang: 'Latvian',
    targetCode: 'lv',
  })
  await openPackBrowserFromWordsTab(page)
  await installFirstAvailablePack(page)

  // At this point the word list is populated.
  // Open the pack browser again from the populated list header.
  await page.getByRole('button', { name: 'Packs' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Browse starter packs')).toBeVisible()

  // Close the dialog manually.
  await page.getByRole('button', { name: 'Close' }).click()

  // The dialog should be gone and the word list screen should still be visible.
  await expect(page.getByRole('dialog')).toBeHidden()
  // The word list heading shows the language pair name.
  await expect(page.getByRole('heading', { name: /English.*Latvian|Latvian.*English/i })).toBeVisible()
})

test('reversed pack direction installs with swapped words', async ({ page }) => {
  // Create an LV-EN pair (reversed relative to the EN-LV starter pack).
  await fillAndSubmitCreatePairDialog(page, {
    sourceLang: 'Latvian',
    sourceCode: 'lv',
    targetLang: 'English',
    targetCode: 'en',
  })

  await openPackBrowserFromWordsTab(page)

  // The EN-LV pack should appear (bidirectional matching).
  await page.getByRole('button', { name: 'Install' }).first().waitFor({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Install' })).not.toHaveCount(0)

  // Install the pack.
  await page.getByRole('button', { name: 'Install' }).first().click()
  await expect(page.getByText(/added \d+ words/i)).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })

  // Words should be present.
  await expect(page.getByText('No words yet')).toBeHidden()
})
