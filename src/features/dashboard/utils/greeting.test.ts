import { describe, it, expect } from 'vitest'
import { getGreetingForHour, getCurrentGreeting } from './greeting'

describe('getGreetingForHour', () => {
  it('should return "Good morning!" for midnight (hour 0)', () => {
    expect(getGreetingForHour(0)).toBe('Good morning!')
  })

  it('should return "Good morning!" for hour 6', () => {
    expect(getGreetingForHour(6)).toBe('Good morning!')
  })

  it('should return "Good morning!" for hour 11', () => {
    expect(getGreetingForHour(11)).toBe('Good morning!')
  })

  it('should return "Good afternoon!" for noon (hour 12)', () => {
    expect(getGreetingForHour(12)).toBe('Good afternoon!')
  })

  it('should return "Good afternoon!" for hour 15', () => {
    expect(getGreetingForHour(15)).toBe('Good afternoon!')
  })

  it('should return "Good afternoon!" for hour 17', () => {
    expect(getGreetingForHour(17)).toBe('Good afternoon!')
  })

  it('should return "Good evening!" for hour 18', () => {
    expect(getGreetingForHour(18)).toBe('Good evening!')
  })

  it('should return "Good evening!" for hour 21', () => {
    expect(getGreetingForHour(21)).toBe('Good evening!')
  })

  it('should return "Good evening!" for hour 23', () => {
    expect(getGreetingForHour(23)).toBe('Good evening!')
  })
})

describe('getCurrentGreeting', () => {
  it('should return a non-empty string', () => {
    expect(getCurrentGreeting()).toMatch(/^Good (morning|afternoon|evening)!$/)
  })
})
