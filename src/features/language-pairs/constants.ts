/**
 * Common language presets for the language pair creation form.
 * Each entry has a human-readable name and BCP-47 language code.
 * Ordered by commonality for the Lexio MVP audience.
 */
export interface LanguagePreset {
  readonly name: string
  readonly code: string
}

export const LANGUAGE_PRESETS: readonly LanguagePreset[] = [
  { name: 'English', code: 'en' },
  { name: 'Latvian', code: 'lv' },
  { name: 'German', code: 'de' },
  { name: 'Russian', code: 'ru' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'Italian', code: 'it' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Dutch', code: 'nl' },
  { name: 'Polish', code: 'pl' },
  { name: 'Swedish', code: 'sv' },
  { name: 'Norwegian', code: 'no' },
  { name: 'Danish', code: 'da' },
  { name: 'Finnish', code: 'fi' },
  { name: 'Czech', code: 'cs' },
  { name: 'Ukrainian', code: 'uk' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Chinese (Simplified)', code: 'zh-CN' },
  { name: 'Korean', code: 'ko' },
  { name: 'Arabic', code: 'ar' },
] as const

/**
 * Default pair suggested to users on first launch.
 * EN source, LV target - matches the primary MVP audience.
 */
export const DEFAULT_PAIR_PRESET = {
  sourceLang: 'English',
  sourceCode: 'en',
  targetLang: 'Latvian',
  targetCode: 'lv',
} as const
