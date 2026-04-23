import { describe, it, expect } from 'vitest'
import { classifyBucket, FAMILIAR_THRESHOLD, MASTERED_THRESHOLD } from './buckets'

describe('buckets', () => {
  describe('classifyBucket', () => {
    it('should return "new" for null confidence (never reviewed)', () => {
      expect(classifyBucket(null)).toBe('new')
    })

    it('should return "learning" for confidence of 0', () => {
      expect(classifyBucket(0)).toBe('learning')
    })

    it('should return "learning" for confidence just below FAMILIAR_THRESHOLD', () => {
      expect(classifyBucket(FAMILIAR_THRESHOLD - 0.01)).toBe('learning')
    })

    it('should return "familiar" at exactly FAMILIAR_THRESHOLD', () => {
      expect(classifyBucket(FAMILIAR_THRESHOLD)).toBe('familiar')
    })

    it('should return "familiar" just above FAMILIAR_THRESHOLD', () => {
      expect(classifyBucket(FAMILIAR_THRESHOLD + 0.01)).toBe('familiar')
    })

    it('should return "familiar" just below MASTERED_THRESHOLD', () => {
      expect(classifyBucket(MASTERED_THRESHOLD - 0.01)).toBe('familiar')
    })

    it('should return "mastered" at exactly MASTERED_THRESHOLD', () => {
      expect(classifyBucket(MASTERED_THRESHOLD)).toBe('mastered')
    })

    it('should return "mastered" just above MASTERED_THRESHOLD', () => {
      expect(classifyBucket(MASTERED_THRESHOLD + 0.01)).toBe('mastered')
    })

    it('should return "mastered" for confidence of 1.0', () => {
      expect(classifyBucket(1.0)).toBe('mastered')
    })

    it('should return "learning" for very low positive confidence', () => {
      expect(classifyBucket(0.01)).toBe('learning')
    })

    it('should return "familiar" for midpoint between thresholds', () => {
      const mid = (FAMILIAR_THRESHOLD + MASTERED_THRESHOLD) / 2
      expect(classifyBucket(mid)).toBe('familiar')
    })
  })

  describe('threshold constants', () => {
    it('should have FAMILIAR_THRESHOLD of 0.5', () => {
      expect(FAMILIAR_THRESHOLD).toBe(0.5)
    })

    it('should have MASTERED_THRESHOLD of 0.8', () => {
      expect(MASTERED_THRESHOLD).toBe(0.8)
    })

    it('FAMILIAR_THRESHOLD should be less than MASTERED_THRESHOLD', () => {
      expect(FAMILIAR_THRESHOLD).toBeLessThan(MASTERED_THRESHOLD)
    })
  })
})
