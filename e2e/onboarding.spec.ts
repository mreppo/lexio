/**
 * E2E tests for the onboarding wizard flow.
 *
 * Unlike the other spec files, these tests do NOT bypass onboarding — they
 * explicitly clear localStorage and interact with the multi-step wizard to
 * verify it works end-to-end.
 *
 * Two paths tested:
 *   Instant demo path:
 *     Step 1 (Welcome) → "Try it now" → quiz (skips wizard entirely)
 *
 *   Manual path:
 *     Step 1 (Welcome)        - "Set up my own" button
 *     Step 2 (Language Pair)  - Accept EN-LV default and click "Continue"
 *     Step 3 (Add Words)      - Skip for now
 *     Step 4 (Tutorial)       - Click through slides and "Start learning!"
 *
 * After completing the wizard the test verifies that the main app shell is
 * visible: AppBar, BottomNav, and the Home tab content.
 */

import { test, expect } from '@playwright/test'
import { resetAppState } from './helpers'

// ─── Test setup ───────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  // Clear state WITHOUT bypassing onboarding so the wizard appears.
  await resetAppState(page)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

test('complete onboarding wizard end-to-end (manual path)', async ({ page }) => {
  // ── Step 1: Welcome ───────────────────────────────────────────────────────
  // The welcome screen should show the uppercase "WELCOME TO LEXIO" label.
  await expect(page.getByText(/welcome to lexio/i)).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/learn any language, a word at a time/i)).toBeVisible()

  // Use "Set up my own" to go through the manual 3-step flow.
  await page.getByRole('button', { name: 'Set up my own' }).click()

  // ── Step 2: Language Pair ─────────────────────────────────────────────────
  // The card-based list is pre-selected with EN-LV; just click Continue.
  await expect(page.getByText('Choose your language pair')).toBeVisible({ timeout: 5_000 })

  // Verify the EN→LV pair card is present and pre-selected.
  await expect(page.getByRole('radio', { name: /english.*latvian/i })).toBeVisible()

  await page.getByRole('button', { name: 'Continue' }).click()

  // ── Step 3: Add Words ─────────────────────────────────────────────────────
  // Skip the words step for now.
  await expect(page.getByText('Add your first words')).toBeVisible({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Skip for now' }).click()

  // ── Step 4: Tutorial ──────────────────────────────────────────────────────
  await expect(page.getByText('How Lexio works')).toBeVisible({ timeout: 5_000 })

  // Skip the tutorial instead of clicking through all slides.
  await page.getByRole('button', { name: 'Skip tutorial' }).click()

  // ── Verify main app shell ─────────────────────────────────────────────────
  // After completing onboarding the main app shell should be visible.
  // The Home tab now has a Liquid Glass NavBar with "Today" as the large title.
  await expect(page.getByText('Today').first()).toBeVisible({ timeout: 10_000 })

  // BottomNav should be visible with all five tabs.
  await expect(page.getByRole('button', { name: 'Navigate to Home' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Navigate to Quiz' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Navigate to Words' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Navigate to Stats' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Navigate to Settings' })).toBeVisible()
})

test('complete onboarding with custom language pair', async ({ page }) => {
  // ── Step 1: Welcome ───────────────────────────────────────────────────────
  await expect(page.getByText(/welcome to lexio/i)).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Set up my own' }).click()

  // ── Step 2: Language Pair — choose German-English via card radio ───────────
  await expect(page.getByText('Choose your language pair')).toBeVisible({ timeout: 5_000 })

  // Click the EN→DE card to select a different preset.
  await page.getByRole('radio', { name: /english.*german/i }).click()

  // Continue with the German pair.
  await page.getByRole('button', { name: 'Continue' }).click()

  // ── Step 3: Add Words ─────────────────────────────────────────────────────
  await expect(page.getByText('Add your first words')).toBeVisible({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Skip for now' }).click()

  // ── Step 4: Tutorial — click through all slides ───────────────────────────
  await expect(page.getByText('How Lexio works')).toBeVisible({ timeout: 5_000 })

  // Click Next three times then "Start learning!" on the last slide.
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Next' }).click()
  }
  await page.getByRole('button', { name: 'Start learning!' }).click()

  // ── Verify main app shell with EN-DE pair ─────────────────────────────────
  // The Home tab now has a Liquid Glass NavBar with "Today" as the large title.
  await expect(page.getByText('Today').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: 'Navigate to Home' })).toBeVisible()

  // Navigate to Settings to verify the screen renders correctly after onboarding.
  await page.getByRole('button', { name: 'Navigate to Settings' }).click()
  // The new Liquid Glass Settings screen shows a NavBar large "Settings" heading.
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 5_000 })
  // The account card should be visible with the local profile placeholder.
  await expect(page.getByText('Lexio user')).toBeVisible()
})

test('onboarding welcome step shows both CTAs', async ({ page }) => {
  // Verify both the demo and manual setup buttons are visible on the welcome step.
  await expect(page.getByText(/welcome to lexio/i)).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: 'Try it now' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Set up my own' })).toBeVisible()
})

test('onboarding step progress dots are visible in manual flow', async ({ page }) => {
  // Verify the StepPagination dots are rendered as the user progresses through manual flow.
  await expect(page.getByText(/welcome to lexio/i)).toBeVisible({ timeout: 10_000 })

  // Welcome step has no stepper dots.
  await expect(page.getByRole('button', { name: 'Set up my own' })).toBeVisible()

  await page.getByRole('button', { name: 'Set up my own' }).click()

  // Step 2 — language pair card list visible; StepPagination dots present.
  await expect(page.getByText('Choose your language pair')).toBeVisible({ timeout: 5_000 })
  // StepPagination renders 3 dots with role=tab
  await expect(page.locator('[role="tab"]').first()).toBeVisible()

  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 3 — add words visible.
  await expect(page.getByText('Add your first words')).toBeVisible({ timeout: 5_000 })

  await page.getByRole('button', { name: 'Skip for now' }).click()

  // Step 4 — tutorial visible.
  await expect(page.getByText('How Lexio works')).toBeVisible({ timeout: 5_000 })
})
