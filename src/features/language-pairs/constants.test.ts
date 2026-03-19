import { describe, it, expect } from 'vitest'
import { LANGUAGE_PRESETS, DEFAULT_PAIR_PRESET } from './constants'

describe('LANGUAGE_PRESETS', () => {
  it('should contain English and Latvian presets', () => {
    const codes = LANGUAGE_PRESETS.map((p) => p.code)
    expect(codes).toContain('en')
    expect(codes).toContain('lv')
  })

  it('should have unique codes', () => {
    const codes = LANGUAGE_PRESETS.map((p) => p.code)
    const unique = new Set(codes)
    expect(unique.size).toBe(codes.length)
  })

  it('should have non-empty name and code for every preset', () => {
    for (const preset of LANGUAGE_PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0)
      expect(preset.code.length).toBeGreaterThan(0)
    }
  })
})

describe('DEFAULT_PAIR_PRESET', () => {
  it('should have English as source language', () => {
    expect(DEFAULT_PAIR_PRESET.sourceLang).toBe('English')
    expect(DEFAULT_PAIR_PRESET.sourceCode).toBe('en')
  })

  it('should have Latvian as target language', () => {
    expect(DEFAULT_PAIR_PRESET.targetLang).toBe('Latvian')
    expect(DEFAULT_PAIR_PRESET.targetCode).toBe('lv')
  })
})
