import { useState, useEffect, useCallback, useRef } from 'react'
import { useStorage } from './useStorage'

/**
 * The platform/browser environment relevant to PWA install behaviour.
 */
export type InstallPlatform =
  | 'android-chrome'
  | 'desktop-chromium'
  | 'ios-safari'
  | 'other'
  | 'standalone'

/**
 * Storage keys used for install-banner metadata.
 * All keys are namespaced under "lexio:meta:" so they are never accidentally
 * cleared by features that iterate "lexio:" keys.
 */
const STORAGE_KEYS = {
  VISIT_COUNT: 'lexio:meta:install-banner:visit-count',
  DISMISSED_AT: 'lexio:meta:install-banner:dismissed-at',
  QUIZ_SESSIONS: 'lexio:meta:install-banner:quiz-sessions',
} as const

/**
 * How long (ms) to suppress the banner after the user dismisses it (7 days).
 */
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Minimum number of app visits before the banner is allowed to appear.
 */
const MIN_VISITS = 2

/**
 * Detect the current platform / browser combination for install guidance.
 *
 * Returns "standalone" when the app is already running as an installed PWA,
 * which suppresses the banner entirely.
 */
export function detectInstallPlatform(): InstallPlatform {
  const nav = navigator as Navigator & { standalone?: boolean }

  // Already installed — running in standalone / fullscreen PWA mode.
  const isStandalone =
    nav.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches

  if (isStandalone) return 'standalone'

  const ua = navigator.userAgent

  // iOS Safari detection.
  // iPadOS Safari spoofs macOS user agent, so we use maxTouchPoints as an
  // additional signal to distinguish iPad from a real Mac.
  const isIos =
    /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 0)
  // Safari on iOS does NOT include "Chrome" or "CriOS" in its UA.
  const isSafari = /^((?!chrome|crios|fxios|EdgiOS).)*safari/i.test(ua)

  if (isIos && isSafari) return 'ios-safari'

  // Chromium-based browsers that support beforeinstallprompt.
  const isChromium = /chrome|chromium/i.test(ua) && !/edg\//i.test(ua)
  const isAndroid = /android/i.test(ua)

  if (isChromium && isAndroid) return 'android-chrome'
  // Edge and non-Android Chromium (desktop Chrome, Edge Chromium) also support
  // the beforeinstallprompt API.
  if (/chrome|chromium|edg\//i.test(ua) && !isAndroid) return 'desktop-chromium'

  return 'other'
}

/**
 * Emits a named analytics event.
 * Currently implemented as console breadcrumbs only — swap to Sentry or a
 * real analytics SDK here without touching call sites.
 */
function trackEvent(
  name:
    | 'install_banner_shown'
    | 'install_banner_dismissed'
    | 'install_banner_accepted'
    | 'pwa_installed',
): void {
  // eslint-disable-next-line no-console
  console.info(`[lexio:analytics] ${name}`)
}

/**
 * State and actions exposed by useInstallPrompt.
 */
export interface InstallPromptState {
  /** Whether the install banner should currently be shown. */
  showBanner: boolean
  /** The detected platform (used by the banner to pick appropriate UI). */
  platform: InstallPlatform
  /**
   * Call this when the user taps "Install".
   * On Android/desktop this triggers the native prompt; on iOS it's a no-op
   * (the banner switches to showing step-by-step instructions instead).
   */
  triggerInstall: () => Promise<void>
  /** Call this when the user dismisses the banner. */
  dismissBanner: () => void
  /**
   * Call this after the user completes a quiz session that had >= 5 questions.
   * Used to satisfy the engagement threshold.
   */
  recordQuizSession: () => void
}

/**
 * Manages PWA install prompt logic:
 * - Platform detection
 * - Engagement threshold tracking (visits + quiz sessions via StorageService)
 * - `beforeinstallprompt` event capture for Android/desktop Chromium
 * - Dismissal with 7-day cooldown
 */
export function useInstallPrompt(): InstallPromptState {
  const storage = useStorage()

  const [platform, setPlatform] = useState<InstallPlatform>('other')
  const [showBanner, setShowBanner] = useState(false)
  // Ref to the captured beforeinstallprompt event — cleared after use.
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  // Whether the engagement check has been satisfied (loaded async from storage).
  const [engagementMet, setEngagementMet] = useState(false)

  // Detect platform once on mount.
  useEffect(() => {
    setPlatform(detectInstallPlatform())
  }, [])

  // Capture the beforeinstallprompt event as early as possible.
  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event): void {
      // Prevent the default mini-infobar on mobile Chrome.
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Track appinstalled event for analytics.
  useEffect(() => {
    function handleAppInstalled(): void {
      trackEvent('pwa_installed')
      setShowBanner(false)
    }
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // On mount: increment visit count and check engagement threshold.
  useEffect(() => {
    async function checkEngagement(): Promise<void> {
      const rawCount = await storage.getItem(STORAGE_KEYS.VISIT_COUNT)
      const visitCount = rawCount !== null ? parseInt(rawCount, 10) : 0
      const newCount = visitCount + 1
      await storage.setItem(STORAGE_KEYS.VISIT_COUNT, String(newCount))

      // Check if visit threshold is already met.
      if (newCount >= MIN_VISITS) {
        setEngagementMet(true)
        return
      }

      // Check if quiz session threshold is already met.
      const rawSessions = await storage.getItem(STORAGE_KEYS.QUIZ_SESSIONS)
      const sessions = rawSessions !== null ? parseInt(rawSessions, 10) : 0
      if (sessions >= 1) {
        setEngagementMet(true)
      }
    }

    void checkEngagement()
  }, [storage])

  // Whenever platform or engagement changes, decide whether to show banner.
  useEffect(() => {
    if (!engagementMet) return
    if (platform === 'standalone') return

    async function maybeShow(): Promise<void> {
      const dismissedAt = await storage.getItem(STORAGE_KEYS.DISMISSED_AT)
      if (dismissedAt !== null) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10)
        if (elapsed < DISMISS_COOLDOWN_MS) return
      }
      setShowBanner(true)
      trackEvent('install_banner_shown')
    }

    void maybeShow()
  }, [engagementMet, platform, storage])

  const triggerInstall = useCallback(async (): Promise<void> => {
    trackEvent('install_banner_accepted')
    const prompt = deferredPromptRef.current
    if (prompt) {
      await prompt.prompt()
      // Whether the user accepted or declined, clear the stored prompt.
      deferredPromptRef.current = null
      setShowBanner(false)
    }
    // On iOS / other: the banner component handles showing the instructions
    // modal itself; this function is a no-op.
  }, [])

  const dismissBanner = useCallback((): void => {
    trackEvent('install_banner_dismissed')
    setShowBanner(false)
    void storage.setItem(STORAGE_KEYS.DISMISSED_AT, String(Date.now()))
  }, [storage])

  const recordQuizSession = useCallback((): void => {
    async function record(): Promise<void> {
      const raw = await storage.getItem(STORAGE_KEYS.QUIZ_SESSIONS)
      const current = raw !== null ? parseInt(raw, 10) : 0
      const next = current + 1
      await storage.setItem(STORAGE_KEYS.QUIZ_SESSIONS, String(next))
      // Check if this session satisfies the engagement threshold.
      if (next >= 1) {
        setEngagementMet(true)
      }
    }
    void record()
  }, [storage])

  return { showBanner, platform, triggerInstall, dismissBanner, recordQuizSession }
}

/**
 * Browser-standard BeforeInstallPromptEvent type (not yet in TypeScript's lib.dom).
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
