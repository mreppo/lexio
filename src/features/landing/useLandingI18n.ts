import { useState, useCallback, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'

/** Supported landing page languages. */
export type LandingLang = 'en' | 'lv'

/** Storage key for persisting the user's language choice. */
const LANG_STORAGE_KEY = 'lexio-landing-lang'

/**
 * All translatable strings used on the landing page.
 * New strings must be added to both EN and LV entries simultaneously.
 */
export interface LandingTranslations {
  readonly heroTagline: string
  readonly heroSubtitle: string
  readonly tryItNow: string
  readonly setUpYourOwn: string
  readonly featuresSectionTitle: string
  readonly featuresSectionSubtitle: string
  readonly features: readonly {
    readonly title: string
    readonly body: string
  }[]
  readonly footerHowBuilt: string
}

const translations: Record<LandingLang, LandingTranslations> = {
  en: {
    heroTagline: 'Learn vocabulary in any language',
    heroSubtitle: 'A simple way to practise vocabulary every day — no account needed.',
    tryItNow: 'Try it now',
    setUpYourOwn: 'Set up your own',
    featuresSectionTitle: 'Everything you need to learn',
    featuresSectionSubtitle: 'A focused tool that does one thing well.',
    features: [
      {
        title: 'Spaced repetition',
        body: 'Words you struggle with appear more often. Words you know drift into the background.',
      },
      {
        title: 'Multiple quiz modes',
        body: 'Type the answer or pick from multiple choices. Mix both for variety.',
      },
      {
        title: 'Progress and streaks',
        body: 'Track daily streaks, confidence per word, and your overall learning curve.',
      },
      {
        title: 'Works offline',
        body: 'Installable on your home screen. All data stays local — no account required.',
      },
    ],
    footerHowBuilt: 'How it was built',
  },
  lv: {
    heroTagline: 'Apgūsti vārdnīcu jebkurā valodā',
    heroSubtitle: 'Vienkāršs veids, kā katru dienu trenēt vārdnīcu — bez reģistrācijas.',
    tryItNow: 'Izmēģini tagad',
    setUpYourOwn: 'Iestatīt pašam',
    featuresSectionTitle: 'Viss, kas nepieciešams mācīšanās',
    featuresSectionSubtitle: 'Fokusēts rīks, kas dara vienu lietu labi.',
    features: [
      {
        title: 'Intervālu atkārtošana',
        body: 'Vārdi, ar kuriem rodas grūtības, parādās biežāk. Zināmie vārdi paliek fonā.',
      },
      {
        title: 'Vairāki testa veidi',
        body: 'Raksti atbildi vai izvēlies no vairākiem variantiem. Abi veidi kopā dod daudzveidību.',
      },
      {
        title: 'Progress un sērijas',
        body: 'Seko dienas sērijām, katras vārda pārliecībai un kopējai mācīšanās līknei.',
      },
      {
        title: 'Darbojas bez interneta',
        body: 'Uzstādāms sākuma ekrānā. Visi dati glabājas lokāli — konts nav nepieciešams.',
      },
    ],
    footerHowBuilt: 'Kā tas tika izveidots',
  },
}

/**
 * Detects the preferred language from the browser's navigator.language.
 * Returns 'lv' if the primary language tag is Latvian, otherwise 'en'.
 */
function detectBrowserLang(): LandingLang {
  const primary = navigator.language.split('-')[0].toLowerCase()
  return primary === 'lv' ? 'lv' : 'en'
}

/**
 * Hook that provides landing-page translations, the current language, and a toggle function.
 *
 * Priority: persisted StorageService value > browser auto-detection.
 * Persists user choice under the key 'lexio-landing-lang'.
 *
 * Returns { t, lang, toggle } where:
 *   t      – the full translations object for the current language
 *   lang   – the current language code ('en' | 'lv')
 *   toggle – swaps between EN and LV and persists the new choice
 */
export function useLandingI18n(): {
  t: LandingTranslations
  lang: LandingLang
  toggle: () => void
} {
  const storage = useStorage()

  // Initialise with browser detection; will be overridden by persisted value once loaded.
  const [lang, setLang] = useState<LandingLang>(detectBrowserLang)

  // On mount, check if a persisted preference exists and apply it.
  useEffect(() => {
    void storage.getItem(LANG_STORAGE_KEY).then((stored) => {
      if (stored === 'lv' || stored === 'en') {
        setLang(stored)
      }
    })
  }, [storage])

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next: LandingLang = prev === 'en' ? 'lv' : 'en'
      void storage.setItem(LANG_STORAGE_KEY, next)
      return next
    })
  }, [storage])

  return { t: translations[lang], lang, toggle }
}
