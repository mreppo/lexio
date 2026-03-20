/**
 * E2E tests for word CRUD operations.
 *
 * Covers the full add → edit → delete flow to ensure the form dialogs,
 * the word list, and the underlying storage all work end-to-end.
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

test('add, edit, and delete a word', async ({ page }) => {
  // ── Setup: navigate to Words tab ─────────────────────────────────────────
  // The EN-LV pair is already active (injected via bypassOnboarding).
  await navigateTo(page, 'Words')
  await expect(page.getByText('No words yet')).toBeVisible()

  // ── Add a word ───────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Add your first word' }).click()

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Add word' })).toBeVisible()

  await page.getByLabel('Source word').fill('hello')
  await page.getByLabel('Target word').fill('sveiki')

  // Submit the form using the "Add word" button inside the dialog.
  await page.getByRole('button', { name: 'Add word' }).last().click()

  // Dialog should close.
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })

  // The word should appear in the list.
  await expect(page.getByText('hello')).toBeVisible()
  await expect(page.getByText('sveiki')).toBeVisible()

  // ── Edit the word ────────────────────────────────────────────────────────
  // WordListItem renders edit button with aria-label "Edit <source>"
  await page.getByRole('button', { name: 'Edit hello' }).click()

  // The Edit Word dialog should open pre-filled with the current values.
  await expect(page.getByText('Edit word')).toBeVisible()
  await expect(page.getByLabel('Target word')).toHaveValue('sveiki')

  // Update the target word.
  await page.getByLabel('Target word').fill('čau')

  await page.getByRole('button', { name: 'Save' }).click()

  // Dialog should close.
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })

  // The updated value should be shown.
  await expect(page.getByText('čau')).toBeVisible()
  await expect(page.getByText('sveiki')).toBeHidden()

  // ── Delete the word ───────────────────────────────────────────────────────
  // WordListItem renders delete button with aria-label "Delete <source>"
  await page.getByRole('button', { name: 'Delete hello' }).click()

  // A DeleteWordDialog confirmation appears.
  await expect(page.getByText(/delete word/i)).toBeVisible()
  await page.getByRole('button', { name: 'Delete' }).click()

  // The word should no longer appear.
  await expect(page.getByText('hello')).toBeHidden({ timeout: 10_000 })

  // The empty state should reappear.
  await expect(page.getByText('No words yet')).toBeVisible()
})
