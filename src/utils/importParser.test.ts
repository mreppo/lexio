import { describe, it, expect } from 'vitest'
import { parseImportText, findDuplicateLineNumbers } from './importParser'

describe('parseImportText', () => {
  describe('comma-separated', () => {
    it('should parse simple source,target pairs', () => {
      const result = parseImportText('hello,hallo\nworld,Welt')
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toMatchObject({
        source: 'hello',
        target: 'hallo',
        notes: null,
        lineNumber: 1,
      })
      expect(result.rows[1]).toMatchObject({
        source: 'world',
        target: 'Welt',
        notes: null,
        lineNumber: 2,
      })
      expect(result.errors).toHaveLength(0)
    })

    it('should parse source,target,notes triplets', () => {
      const result = parseImportText('cat,Katze,a small animal')
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0]).toMatchObject({
        source: 'cat',
        target: 'Katze',
        notes: 'a small animal',
      })
    })

    it('should trim whitespace from fields', () => {
      const result = parseImportText('  hello  ,  world  ,  note  ')
      expect(result.rows[0]).toMatchObject({ source: 'hello', target: 'world', notes: 'note' })
    })

    it('should ignore fields beyond the third', () => {
      const result = parseImportText('a,b,c,d,e')
      expect(result.rows[0]).toMatchObject({ source: 'a', target: 'b', notes: 'c' })
    })
  })

  describe('tab-separated', () => {
    it('should parse tab-separated pairs', () => {
      const result = parseImportText('dog\tHund\ncat\tKatze')
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toMatchObject({ source: 'dog', target: 'Hund', notes: null })
      expect(result.rows[1]).toMatchObject({ source: 'cat', target: 'Katze', notes: null })
    })

    it('should parse tab-separated triplets', () => {
      const result = parseImportText('run\tlaufen\tto run fast')
      expect(result.rows[0]).toMatchObject({
        source: 'run',
        target: 'laufen',
        notes: 'to run fast',
      })
    })
  })

  describe('semicolon-separated', () => {
    it('should parse semicolon-separated pairs', () => {
      const result = parseImportText('maison;house\nchat;cat')
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toMatchObject({ source: 'maison', target: 'house' })
      expect(result.rows[1]).toMatchObject({ source: 'chat', target: 'cat' })
    })

    it('should parse semicolon-separated triplets with notes', () => {
      const result = parseImportText('bonjour;hello;a greeting')
      expect(result.rows[0]).toMatchObject({
        source: 'bonjour',
        target: 'hello',
        notes: 'a greeting',
      })
    })
  })

  describe('auto-detect delimiter', () => {
    it('should prefer tab when tabs are dominant', () => {
      const result = parseImportText('a\tb\nc\td')
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toMatchObject({ source: 'a', target: 'b' })
    })

    it('should prefer semicolon when semicolons are dominant', () => {
      const result = parseImportText('a;b\nc;d\ne;f')
      expect(result.rows).toHaveLength(3)
      expect(result.rows[0]).toMatchObject({ source: 'a', target: 'b' })
    })

    it('should fall back to comma when no delimiter found', () => {
      const result = parseImportText('hello,world')
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0]).toMatchObject({ source: 'hello', target: 'world' })
    })
  })

  describe('empty lines and whitespace', () => {
    it('should skip empty lines', () => {
      const result = parseImportText('\nhello,world\n\nfoo,bar\n')
      expect(result.rows).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
    })

    it('should skip lines with only whitespace', () => {
      const result = parseImportText('a,b\n   \nc,d')
      expect(result.rows).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('mixed line endings', () => {
    it('should handle Windows CRLF line endings', () => {
      const result = parseImportText('hello,world\r\nfoo,bar\r\n')
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toMatchObject({ source: 'hello', target: 'world' })
      expect(result.rows[1]).toMatchObject({ source: 'foo', target: 'bar' })
    })

    it('should handle Unix LF line endings', () => {
      const result = parseImportText('hello,world\nfoo,bar\n')
      expect(result.rows).toHaveLength(2)
    })

    it('should handle mixed CRLF and LF in same input', () => {
      const result = parseImportText('hello,world\r\nfoo,bar\nbaz,qux')
      expect(result.rows).toHaveLength(3)
    })
  })

  describe('error handling', () => {
    it('should flag lines with only one field', () => {
      const result = parseImportText('hello\nfoo,bar')
      expect(result.rows).toHaveLength(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].lineNumber).toBe(1)
      expect(result.errors[0].raw).toBe('hello')
    })

    it('should flag lines where source is empty', () => {
      const result = parseImportText(',target\ngood,line')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].lineNumber).toBe(1)
    })

    it('should flag lines where target is empty', () => {
      const result = parseImportText('source,\ngood,line')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].lineNumber).toBe(1)
    })

    it('should include reason in error row', () => {
      const result = parseImportText('bad-line')
      expect(result.errors[0].reason).toMatch(/source and target/)
    })

    it('should continue parsing after an error', () => {
      const result = parseImportText('bad\ngood,line\nalso bad\nanother,good')
      expect(result.rows).toHaveLength(2)
      expect(result.errors).toHaveLength(2)
    })

    it('should return empty result for empty input', () => {
      const result = parseImportText('')
      expect(result.rows).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should return empty result for whitespace-only input', () => {
      const result = parseImportText('   \n  \n  ')
      expect(result.rows).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Latvian diacritics', () => {
    it('should preserve Latvian diacritics in source and target', () => {
      const result = parseImportText('ābols,apple\nčau,bye')
      expect(result.rows[0]).toMatchObject({ source: 'ābols', target: 'apple' })
      expect(result.rows[1]).toMatchObject({ source: 'čau', target: 'bye' })
    })

    it('should preserve full diacritic set: ā č ē ģ ī ķ ļ ņ š ū ž', () => {
      const source = 'āčēģīķļņšūž'
      const result = parseImportText(`${source},test`)
      expect(result.rows[0].source).toBe(source)
    })
  })

  describe('lineNumber tracking', () => {
    it('should report correct 1-based line numbers', () => {
      const result = parseImportText('a,b\nbad\nc,d')
      expect(result.rows[0].lineNumber).toBe(1)
      expect(result.errors[0].lineNumber).toBe(2)
      expect(result.rows[1].lineNumber).toBe(3)
    })

    it('should track line numbers correctly when skipping blank lines', () => {
      const result = parseImportText('\na,b\n\nbad\nc,d')
      expect(result.rows[0].lineNumber).toBe(2)
      expect(result.errors[0].lineNumber).toBe(4)
      expect(result.rows[1].lineNumber).toBe(5)
    })
  })
})

describe('findDuplicateLineNumbers', () => {
  const existingWords = [
    { source: 'hello', target: 'world' },
    { source: 'Cat', target: 'KATZE' },
  ]

  it('should detect exact duplicate', () => {
    const rows = [{ source: 'hello', target: 'world', notes: null, lineNumber: 1 }]
    const dupes = findDuplicateLineNumbers(rows, existingWords)
    expect(dupes.has(1)).toBe(true)
  })

  it('should detect case-insensitive duplicates', () => {
    const rows = [
      { source: 'HELLO', target: 'WORLD', notes: null, lineNumber: 1 },
      { source: 'cat', target: 'katze', notes: null, lineNumber: 2 },
    ]
    const dupes = findDuplicateLineNumbers(rows, existingWords)
    expect(dupes.has(1)).toBe(true)
    expect(dupes.has(2)).toBe(true)
  })

  it('should not flag non-duplicates', () => {
    const rows = [{ source: 'dog', target: 'Hund', notes: null, lineNumber: 1 }]
    const dupes = findDuplicateLineNumbers(rows, existingWords)
    expect(dupes.has(1)).toBe(false)
  })

  it('should return empty set for empty rows', () => {
    const dupes = findDuplicateLineNumbers([], existingWords)
    expect(dupes.size).toBe(0)
  })

  it('should return empty set when no existing words', () => {
    const rows = [{ source: 'hello', target: 'world', notes: null, lineNumber: 1 }]
    const dupes = findDuplicateLineNumbers(rows, [])
    expect(dupes.size).toBe(0)
  })

  it('should only mark a row as duplicate if both source and target match', () => {
    const rows = [
      { source: 'hello', target: 'different', notes: null, lineNumber: 1 },
      { source: 'different', target: 'world', notes: null, lineNumber: 2 },
    ]
    const dupes = findDuplicateLineNumbers(rows, existingWords)
    expect(dupes.size).toBe(0)
  })
})
