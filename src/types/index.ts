export interface LanguagePair {
  readonly id: string
  readonly sourceLang: string
  readonly targetLang: string
  readonly sourceCode: string
  readonly targetCode: string
  readonly createdAt: number
}

export interface Word {
  readonly id: string
  readonly pairId: string
  readonly source: string
  readonly target: string
  readonly notes: string | null
  readonly tags: readonly string[]
  readonly createdAt: number
  readonly isFromPack: boolean
}

export type QuizDirection = 'source-to-target' | 'target-to-source'
export type QuizMode = 'type' | 'choice' | 'mixed'

export interface AttemptRecord {
  readonly direction: QuizDirection
  readonly mode: Exclude<QuizMode, 'mixed'>
  readonly correct: boolean
  readonly timestamp: number
}

export interface WordProgress {
  readonly wordId: string
  readonly correctCount: number
  readonly incorrectCount: number
  readonly streak: number
  readonly lastReviewed: number | null
  readonly nextReview: number
  readonly confidence: number
  readonly history: readonly AttemptRecord[]
}

export type ThemePreference = 'light' | 'dark' | 'system'

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/** All CEFR levels in ascending order. */
export const CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export interface UserSettings {
  readonly activePairId: string | null
  readonly quizMode: QuizMode
  readonly dailyGoal: number
  readonly theme: ThemePreference
  readonly typoTolerance: number
  /**
   * CEFR levels the user wants to train.
   * Empty array means "all levels" (no filtering applied).
   */
  readonly selectedLevels: readonly CefrLevel[]
  /**
   * Optional display name for the avatar placeholder.
   * Null means not set — the app falls back to the initial "L" for Lexio.
   * This is a placeholder for future auth integration.
   */
  readonly displayName?: string | null
  /**
   * Sound effects toggle — whether UI sound effects are enabled.
   * Defaults to false (no sounds in MVP). Persisted via StorageService.
   */
  readonly soundEffects?: boolean
  /**
   * Auto-play pronunciation toggle — whether to auto-play audio after each answer.
   * TTS implementation is out of scope for MVP; only the preference is stored.
   */
  readonly autoPlayPronunciation?: boolean
  /**
   * Show hint timeout in seconds — how long to wait before showing the hint during quiz.
   * 0 means "Off" (never show hint). Defaults to 10.
   * Valid values: 0, 5, 10, 15, 30.
   */
  readonly showHintTimeout?: number
}

export interface DailyStats {
  readonly date: string
  readonly wordsReviewed: number
  readonly correctCount: number
  readonly incorrectCount: number
  readonly streakDays: number
}

export interface StarterPack {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly sourceCode: string
  readonly targetCode: string
  readonly level: string
  readonly words: ReadonlyArray<{
    readonly source: string
    readonly target: string
    readonly tags: readonly string[]
  }>
}
