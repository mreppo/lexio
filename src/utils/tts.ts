/**
 * TTS (Text-to-Speech) utilities for Lexio.
 *
 * toBCP47 maps two-letter language codes to BCP-47 locale tags used by the
 * Web Speech API's SpeechSynthesisUtterance.lang property. When a code is
 * unknown the raw code is returned as a safe fallback — the browser will
 * silently pick the best available voice or ignore it.
 *
 * speak() feature-detects window.speechSynthesis and SpeechSynthesisUtterance
 * before creating an utterance. It never throws — callers do not need try/catch.
 */

/** Known two-letter ISO 639-1 → BCP-47 locale tag mappings. */
const BCP47_MAP: Readonly<Record<string, string>> = {
  en: 'en-US',
  es: 'es-ES',
  lv: 'lv-LV',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ru: 'ru-RU',
  ar: 'ar-SA',
  nl: 'nl-NL',
  pl: 'pl-PL',
  sv: 'sv-SE',
  no: 'no-NO',
  da: 'da-DK',
  fi: 'fi-FI',
  tr: 'tr-TR',
  cs: 'cs-CZ',
  ro: 'ro-RO',
  hu: 'hu-HU',
  el: 'el-GR',
  uk: 'uk-UA',
  he: 'he-IL',
  hi: 'hi-IN',
  id: 'id-ID',
  th: 'th-TH',
  vi: 'vi-VN',
} as const

/**
 * Convert a two-letter language code to a BCP-47 locale tag.
 * Returns the raw code if the mapping is not known.
 */
export function toBCP47(langCode: string): string {
  return BCP47_MAP[langCode.toLowerCase()] ?? langCode
}

/**
 * Speak the given text using the Web Speech API in the specified language.
 *
 * Feature-detects speechSynthesis + SpeechSynthesisUtterance before use.
 * Silently no-ops if either is unavailable (e.g. Firefox without TTS, SSR).
 * Never throws.
 */
export function speak(text: string, langCode: string): void {
  // Guard: feature-detect both the global and the constructor
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    typeof window.SpeechSynthesisUtterance === 'undefined'
  ) {
    return
  }

  try {
    // Cancel any in-progress utterance to avoid overlap
    window.speechSynthesis.cancel()

    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = toBCP47(langCode)
    // Reasonable speaking rate and pitch for language learning
    utterance.rate = 0.9
    utterance.pitch = 1

    window.speechSynthesis.speak(utterance)
  } catch {
    // Silently swallow any unexpected runtime errors — TTS is best-effort
  }
}
