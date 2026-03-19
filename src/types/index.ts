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

export interface UserSettings {
  readonly activePairId: string | null
  readonly quizMode: QuizMode
  readonly dailyGoal: number
  readonly theme: ThemePreference
  readonly typoTolerance: number
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
