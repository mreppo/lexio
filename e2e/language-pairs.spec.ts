/**
 * E2E tests for language pair management.
 *
 * Covers creating multiple pairs, switching between them via the selector,
 * and deleting a pair through the Language pairs tab.
 */

import { test, expect } from '@playwright/test'
import {
  resetAppState,
  fillAndSubmitCreatePairDialog,
  createLanguagePair,
} from './helpers'

// ─── Test setup ───────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

test('create and switch between language pairs', async ({ page }) => {
  // On first launch the Create Pair dialog opens automatically.
  await fillAndSubmitCreatePairDialog(page, {
    sourceLang: 'German',
    sourceCode: 'de',
    targetLang: 'English',
    targetCode: 'en',
  })

  // The first pair should now be active — visible in the toolbar selector.
  await expect(page.getByRole('button', { name: 'Select language pair' })).toBeVisible()

  // Create a second pair using the toolbar selector's "Add pair" menu item.
  await createLanguagePair(page, {
    sourceLang: 'French',
    sourceCode: 'fr',
    targetLang: 'English',
    targetCode: 'en',
  })

  // Both pairs should appear in the Language pairs tab.
  await page.getByRole('tab', { name: 'Language pairs' }).click()

  // Use the list region to scope the assertions, avoiding the toolbar button.
  const pairList = page.getByRole('list')
  await expect(pairList.getByText('German → English')).toBeVisible()
  await expect(pairList.getByText('French → English')).toBeVisible()

  // Switch to the French-English pair via the toolbar selector.
  await page.getByRole('button', { name: 'Select language pair' }).click()
  await page.getByRole('menuitem', { name: /French.*English/i }).click()

  // After switching the toolbar button should reflect the new active pair.
  await expect(page.getByRole('button', { name: 'Select language pair' })).toContainText('French')
})

test('delete a language pair', async ({ page }) => {
  // Create two pairs so we can delete one without being left with none.
  await fillAndSubmitCreatePairDialog(page, {
    sourceLang: 'Spanish',
    sourceCode: 'es',
    targetLang: 'English',
    targetCode: 'en',
  })

  await createLanguagePair(page, {
    sourceLang: 'Italian',
    sourceCode: 'it',
    targetLang: 'English',
    targetCode: 'en',
  })

  // Navigate to the Language pairs tab.
  await page.getByRole('tab', { name: 'Language pairs' }).click()

  // Both pairs should be visible in the list.
  const pairList = page.getByRole('list')
  await expect(pairList.getByText('Spanish → English')).toBeVisible()
  await expect(pairList.getByText('Italian → English')).toBeVisible()

  // Click the delete button for the Spanish-English pair.
  await page
    .getByRole('button', { name: 'Delete Spanish to English pair' })
    .click()

  // The confirmation dialog should appear.
  const deleteDialog = page.getByRole('dialog')
  await expect(deleteDialog.getByText('Delete language pair?')).toBeVisible()
  await expect(deleteDialog.getByText(/Spanish.*English/)).toBeVisible()

  // Confirm deletion.
  await page.getByRole('button', { name: 'Delete pair' }).click()

  // Dialog should close.
  await expect(page.getByText('Delete language pair?')).toBeHidden({ timeout: 10_000 })

  // Spanish-English should be gone from the list; Italian-English remains.
  await expect(pairList.getByText('Spanish → English')).toBeHidden()
  await expect(pairList.getByText('Italian → English')).toBeVisible()
})
