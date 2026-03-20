/**
 * E2E tests for language pair management.
 *
 * Covers creating multiple pairs, switching between them via the selector,
 * and deleting a pair through the Language pairs section in Settings.
 *
 * Onboarding is bypassed via localStorage pre-population. See
 * `onboarding.spec.ts` for the onboarding wizard tests.
 */

import { test, expect } from '@playwright/test'
import {
  resetAndBypassOnboarding,
  navigateTo,
  fillAndSubmitCreatePairDialog,
  createLanguagePair,
} from './helpers'

// ─── Test setup ───────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await resetAndBypassOnboarding(page)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

test('create and switch between language pairs', async ({ page }) => {
  // The default EN-LV pair is already active from the bypass.
  // Create a second pair using the toolbar selector's "Add pair" menu item.
  await createLanguagePair(page, {
    sourceLang: 'French',
    sourceCode: 'fr',
    targetLang: 'English',
    targetCode: 'en',
  })

  // Both pairs should appear in the Settings → Language pairs section.
  await navigateTo(page, 'Settings')

  // Use the list region to scope the assertions, avoiding the toolbar button.
  const pairList = page.getByRole('list')
  await expect(pairList.getByText('English → Latvian')).toBeVisible()
  await expect(pairList.getByText('French → English')).toBeVisible()

  // Switch to the French-English pair via the toolbar selector.
  await page.getByRole('button', { name: 'Select language pair' }).click()
  await page.getByRole('menuitem', { name: /French.*English/i }).click()

  // After switching the toolbar button should reflect the new active pair.
  await expect(page.getByRole('button', { name: 'Select language pair' })).toContainText('French')
})

test('delete a language pair', async ({ page }) => {
  // The default EN-LV pair exists. Create a second pair so we can delete one
  // without being left with none.
  await createLanguagePair(page, {
    sourceLang: 'Italian',
    sourceCode: 'it',
    targetLang: 'English',
    targetCode: 'en',
  })

  // Navigate to the Settings tab where language pairs are managed.
  await navigateTo(page, 'Settings')

  // Both pairs should be visible in the list.
  const pairList = page.getByRole('list')
  await expect(pairList.getByText('English → Latvian')).toBeVisible()
  await expect(pairList.getByText('Italian → English')).toBeVisible()

  // Click the delete button for the English-Latvian pair.
  await page.getByRole('button', { name: 'Delete English to Latvian pair' }).click()

  // The confirmation dialog should appear.
  const deleteDialog = page.getByRole('dialog')
  await expect(deleteDialog.getByText('Delete language pair?')).toBeVisible()
  await expect(deleteDialog.getByText(/English.*Latvian/)).toBeVisible()

  // Confirm deletion.
  await page.getByRole('button', { name: 'Delete pair' }).click()

  // Dialog should close.
  await expect(page.getByText('Delete language pair?')).toBeHidden({ timeout: 10_000 })

  // English-Latvian should be gone from the list; Italian-English remains.
  await expect(pairList.getByText('English → Latvian')).toBeHidden()
  await expect(pairList.getByText('Italian → English')).toBeVisible()
})

test('create a language pair from onboarding-style dialog', async ({ page }) => {
  // Create a brand-new pair via the AppBar selector dialog.
  await createLanguagePair(page, {
    sourceLang: 'German',
    sourceCode: 'de',
    targetLang: 'English',
    targetCode: 'en',
  })

  // The toolbar button should reflect the new pair was created.
  await expect(page.getByRole('button', { name: 'Select language pair' })).toBeVisible()

  // Navigate to Settings to verify the pair appears in the list.
  await navigateTo(page, 'Settings')
  const pairList = page.getByRole('list')
  await expect(pairList.getByText('German → English')).toBeVisible()
})

test('fill create pair dialog from AppBar and verify', async ({ page }) => {
  // Open the dialog via the AppBar language pair selector.
  await page.getByRole('button', { name: 'Select language pair' }).click()
  await page.getByRole('menuitem', { name: 'Add pair' }).click()

  // Fill and submit the dialog.
  await fillAndSubmitCreatePairDialog(page, {
    sourceLang: 'Spanish',
    sourceCode: 'es',
    targetLang: 'English',
    targetCode: 'en',
  })

  // The toolbar should show the new pair.
  await expect(page.getByRole('button', { name: 'Select language pair' })).toBeVisible()

  // Settings should list the pair.
  await navigateTo(page, 'Settings')
  await expect(page.getByRole('list').getByText('Spanish → English')).toBeVisible()
})
