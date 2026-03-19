export type SortOption =
  | 'source-asc'
  | 'source-desc'
  | 'target-asc'
  | 'target-desc'
  | 'date-asc'
  | 'date-desc'
  | 'confidence-asc'
  | 'confidence-desc'

export type WordFilter = 'all' | 'user-added' | 'from-pack'

export type ConfidenceFilter = 'all' | 'learning' | 'familiar' | 'mastered'

export interface SortOptionConfig {
  readonly value: SortOption
  readonly label: string
}

export const SORT_OPTIONS: readonly SortOptionConfig[] = [
  { value: 'source-asc', label: 'Source (A–Z)' },
  { value: 'source-desc', label: 'Source (Z–A)' },
  { value: 'target-asc', label: 'Target (A–Z)' },
  { value: 'target-desc', label: 'Target (Z–A)' },
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'confidence-asc', label: 'Confidence (low–high)' },
  { value: 'confidence-desc', label: 'Confidence (high–low)' },
] as const

export const WORD_FILTERS: readonly { value: WordFilter; label: string }[] = [
  { value: 'all', label: 'All words' },
  { value: 'user-added', label: 'My words' },
  { value: 'from-pack', label: 'Starter pack' },
] as const

export const CONFIDENCE_FILTERS: readonly { value: ConfidenceFilter; label: string }[] = [
  { value: 'all', label: 'All levels' },
  { value: 'learning', label: 'Learning' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'mastered', label: 'Mastered' },
] as const

/** Confidence thresholds for bucketing words. */
export const CONFIDENCE_THRESHOLDS = {
  FAMILIAR: 0.4,
  MASTERED: 0.75,
} as const

export function getConfidenceBucket(confidence: number | null): ConfidenceFilter {
  if (confidence === null) return 'learning'
  if (confidence >= CONFIDENCE_THRESHOLDS.MASTERED) return 'mastered'
  if (confidence >= CONFIDENCE_THRESHOLDS.FAMILIAR) return 'familiar'
  return 'learning'
}

export const CONFIDENCE_LABELS: Record<ConfidenceFilter, string> = {
  all: 'All',
  learning: 'Learning',
  familiar: 'Familiar',
  mastered: 'Mastered',
}

export const CONFIDENCE_COLORS: Record<
  ConfidenceFilter,
  'default' | 'warning' | 'info' | 'success'
> = {
  all: 'default',
  learning: 'warning',
  familiar: 'info',
  mastered: 'success',
}
