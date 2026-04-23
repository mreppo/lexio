import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { toBCP47, speak } from './tts'

describe('toBCP47', () => {
  it('should map common language codes to BCP-47 tags', () => {
    expect(toBCP47('en')).toBe('en-US')
    expect(toBCP47('es')).toBe('es-ES')
    expect(toBCP47('lv')).toBe('lv-LV')
    expect(toBCP47('de')).toBe('de-DE')
    expect(toBCP47('fr')).toBe('fr-FR')
    expect(toBCP47('it')).toBe('it-IT')
    expect(toBCP47('pt')).toBe('pt-PT')
    expect(toBCP47('ja')).toBe('ja-JP')
    expect(toBCP47('zh')).toBe('zh-CN')
  })

  it('should be case-insensitive', () => {
    expect(toBCP47('EN')).toBe('en-US')
    expect(toBCP47('Es')).toBe('es-ES')
    expect(toBCP47('LV')).toBe('lv-LV')
  })

  it('should return the raw code for unknown languages', () => {
    expect(toBCP47('xx')).toBe('xx')
    expect(toBCP47('zz')).toBe('zz')
    expect(toBCP47('unknown-lang')).toBe('unknown-lang')
  })
})

describe('speak', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call speechSynthesis.speak with correct utterance properties', () => {
    const mockCancel = vi.fn()
    const mockSpeak = vi.fn()
    const MockUtterance = vi.fn().mockImplementation(function (
      this: SpeechSynthesisUtterance,
      text: string,
    ) {
      this.text = text
      this.lang = ''
    })

    vi.stubGlobal('speechSynthesis', { cancel: mockCancel, speak: mockSpeak })
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)

    speak('hola', 'es')

    expect(mockCancel).toHaveBeenCalledTimes(1)
    expect(MockUtterance).toHaveBeenCalledWith('hola')
    expect(mockSpeak).toHaveBeenCalledTimes(1)
    // The utterance passed to speak should have the BCP-47 lang
    const utteranceArg = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utteranceArg.lang).toBe('es-ES')
  })

  it('should silently no-op when speechSynthesis is undefined', () => {
    // Remove speechSynthesis from window by stubbing it as undefined
    vi.stubGlobal('speechSynthesis', undefined)

    expect(() => speak('test', 'en')).not.toThrow()
  })

  it('should silently no-op when SpeechSynthesisUtterance is undefined', () => {
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: vi.fn() })
    vi.stubGlobal('SpeechSynthesisUtterance', undefined)

    expect(() => speak('test', 'en')).not.toThrow()
  })

  it('should cancel any in-progress utterance before speaking', () => {
    const callOrder: string[] = []
    const mockCancel = vi.fn().mockImplementation(() => callOrder.push('cancel'))
    const mockSpeak = vi.fn().mockImplementation(() => callOrder.push('speak'))
    const MockUtterance = vi.fn().mockImplementation(function (this: SpeechSynthesisUtterance) {
      this.lang = ''
    })

    vi.stubGlobal('speechSynthesis', { cancel: mockCancel, speak: mockSpeak })
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)

    speak('word', 'en')

    // cancel must be called before speak
    expect(callOrder).toEqual(['cancel', 'speak'])
  })

  it('should not throw when speechSynthesis.speak throws', () => {
    const MockUtterance = vi.fn().mockImplementation(function (this: SpeechSynthesisUtterance) {
      this.lang = ''
    })
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      speak: vi.fn().mockImplementation(() => {
        throw new Error('TTS error')
      }),
    })

    expect(() => speak('word', 'en')).not.toThrow()
  })
})
