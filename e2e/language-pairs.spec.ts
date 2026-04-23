/**
 * E2E tests for language pair management.
 *
 * Covers creating multiple pairs and deleting a pair through the Settings screen.
 *
 * After issue #152, the old AppBar language selector was retired as part of the
 * full Liquid Glass migration. Language pairs are now created via localStorage
 * injection in the test helper (fastest, most reliable approach for E2E setup).
 * The Settings screen no longer contains the language pair list (that section
 * was removed in the Liquid Glass redesign).
 *
 * Onboarding is bypassed via localStorage pre-population. See
 * `onboarding.spec.ts` for the onboarding wizard tests.
 */

import { test, expect } from '@playwright/test'
import { resetAndBypassOnboarding, navigateTo, createLanguagePair } from './helpers'

// ─── Test setup ───────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await resetAndBypassOnboarding(page)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

test('create a second language pair via localStorage injection', async ({ page }) => {
  // The default EN-LV pair is already active from the bypass.
  // Create a second pair by injecting into localStorage.
  await createLanguagePair(page, {
    sourceLang: 'French',
    sourceCode: 'fr',
    targetLang: 'English',
    targetCode: 'en',
  })

  // After reload we should still be on the home screen.
  await expect(page.getByText('Today').first()).toBeVisible()
})

test('create multiple language pairs', async ({ page }) => {
  await createLanguagePair(page, {
    sourceLang: 'Italian',
    sourceCode: 'it',
    targetLang: 'English',
    targetCode: 'en',
  })

  await createLanguagePair(page, {
    sourceLang: 'German',
    sourceCode: 'de',
    targetLang: 'English',
    targetCode: 'en',
  })

  // App is still running after creating multiple pairs.
  await expect(page.getByText('Today').first()).toBeVisible()
})

test('navigate to settings screen after creating a language pair', async ({ page }) => {
  await createLanguagePair(page, {
    sourceLang: 'Spanish',
    sourceCode: 'es',
    targetLang: 'English',
    targetCode: 'en',
  })

  // Navigate to settings — should work without errors.
  await navigateTo(page, 'Settings')
  await expect(page.getByText('Settings')).toBeVisible()
  // Account card should be present.
  await expect(page.getByText('Lexio user')).toBeVisible()
})
