import { describe, it, expect } from 'vitest'
import { generateId } from './id'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('generateId', () => {
  it('should return a string in UUID v4 format', () => {
    const id = generateId()
    expect(id).toMatch(UUID_REGEX)
  })

  it('should return unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})
