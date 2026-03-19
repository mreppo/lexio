import { describe, it, expect } from 'vitest'
import {
  getConfidenceBucket,
  CONFIDENCE_THRESHOLDS,
  SORT_OPTIONS,
  WORD_FILTERS,
  CONFIDENCE_FILTERS,
} from './constants'

describe('getConfidenceBucket', () => {
  it('should return "learning" when confidence is null', () => {
    expect(getConfidenceBucket(null)).toBe('learning')
  })

  it('should return "learning" when confidence is below familiar threshold', () => {
    expect(getConfidenceBucket(0)).toBe('learning')
    expect(getConfidenceBucket(CONFIDENCE_THRESHOLDS.FAMILIAR - 0.01)).toBe('learning')
  })

  it('should return "familiar" when confidence is at or above familiar threshold', () => {
    expect(getConfidenceBucket(CONFIDENCE_THRESHOLDS.FAMILIAR)).toBe('familiar')
    expect(getConfidenceBucket(CONFIDENCE_THRESHOLDS.MASTERED - 0.01)).toBe('familiar')
  })

  it('should return "mastered" when confidence is at or above mastered threshold', () => {
    expect(getConfidenceBucket(CONFIDENCE_THRESHOLDS.MASTERED)).toBe('mastered')
    expect(getConfidenceBucket(1)).toBe('mastered')
  })
})

describe('SORT_OPTIONS', () => {
  it('should include all expected sort values', () => {
    const values = SORT_OPTIONS.map((o) => o.value)
    expect(values).toContain('source-asc')
    expect(values).toContain('source-desc')
    expect(values).toContain('target-asc')
    expect(values).toContain('target-desc')
    expect(values).toContain('date-asc')
    expect(values).toContain('date-desc')
    expect(values).toContain('confidence-asc')
    expect(values).toContain('confidence-desc')
  })
})

describe('WORD_FILTERS', () => {
  it('should include all, user-added, and from-pack', () => {
    const values = WORD_FILTERS.map((f) => f.value)
    expect(values).toContain('all')
    expect(values).toContain('user-added')
    expect(values).toContain('from-pack')
  })
})

describe('CONFIDENCE_FILTERS', () => {
  it('should include all confidence levels', () => {
    const values = CONFIDENCE_FILTERS.map((f) => f.value)
    expect(values).toContain('all')
    expect(values).toContain('learning')
    expect(values).toContain('familiar')
    expect(values).toContain('mastered')
  })
})
