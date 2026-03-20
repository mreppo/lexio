/**
 * Utilities for parsing bulk word import text in CSV, TSV, and semicolon-separated formats.
 * Auto-detects the delimiter based on the content of the first non-empty line.
 */

export type ParsedWordRow = {
  readonly source: string
  readonly target: string
  readonly notes: string | null
  /** 1-based line number in the original input. */
  readonly lineNumber: number
}

export type ParseErrorRow = {
  readonly raw: string
  readonly lineNumber: number
  readonly reason: string
}

export type ParseResult = {
  readonly rows: readonly ParsedWordRow[]
  readonly errors: readonly ParseErrorRow[]
}

/** Supported delimiters in detection priority order. */
const DELIMITERS = ['\t', ',', ';'] as const
type Delimiter = (typeof DELIMITERS)[number]

/**
 * Detect the most likely delimiter by counting occurrences across the first
 * few non-empty lines. The delimiter that appears most consistently wins.
 */
function detectDelimiter(lines: readonly string[]): Delimiter {
  const sample = lines.filter((l) => l.trim().length > 0).slice(0, 10)

  if (sample.length === 0) return ','

  const counts = DELIMITERS.map((d) => {
    const total = sample.reduce((sum, line) => {
      // Count occurrences of delimiter in this line.
      return sum + (line.split(d).length - 1)
    }, 0)
    return { delimiter: d, total }
  })

  // Pick the delimiter with the highest total count.
  const best = counts.reduce((prev, curr) => (curr.total > prev.total ? curr : prev))

  // Fall back to comma if nothing was detected.
  return best.total > 0 ? best.delimiter : ','
}

/**
 * Parse a raw multi-line string into word rows.
 *
 * Supported formats (auto-detected):
 * - Tab-separated:       source<TAB>target[<TAB>notes]
 * - Comma-separated:     source,target[,notes]
 * - Semicolon-separated: source;target[;notes]
 *
 * Rules:
 * - Empty lines are skipped.
 * - Leading/trailing whitespace is trimmed from each field.
 * - Lines with fewer than 2 non-empty fields are recorded as errors.
 * - A third field (if present) is treated as notes.
 * - Fields beyond the third are ignored.
 */
export function parseImportText(rawText: string): ParseResult {
  const rawLines = rawText.split(/\r?\n/)
  const nonEmptyLines = rawLines.filter((l) => l.trim().length > 0)

  const delimiter = detectDelimiter(nonEmptyLines)

  const rows: ParsedWordRow[] = []
  const errors: ParseErrorRow[] = []

  rawLines.forEach((line, index) => {
    const lineNumber = index + 1

    // Skip blank lines.
    if (line.trim().length === 0) return

    const parts = line.split(delimiter).map((p) => p.trim())
    const source = parts[0] ?? ''
    const target = parts[1] ?? ''

    if (source.length === 0 || target.length === 0) {
      errors.push({
        raw: line,
        lineNumber,
        reason: 'Could not find both source and target values.',
      })
      return
    }

    const notes = parts[2] && parts[2].length > 0 ? parts[2] : null

    rows.push({ source, target, notes, lineNumber })
  })

  return { rows, errors }
}

/**
 * Given a list of parsed rows and a set of existing (source, target) pairs,
 * return a Set of lineNumbers that are duplicates.
 *
 * Comparison is case-insensitive and whitespace-trimmed.
 */
export function findDuplicateLineNumbers(
  rows: readonly ParsedWordRow[],
  existingWords: ReadonlyArray<{ readonly source: string; readonly target: string }>,
): ReadonlySet<number> {
  const existingKeys = new Set(
    existingWords.map((w) => `${w.source.trim().toLowerCase()}||${w.target.trim().toLowerCase()}`),
  )

  const duplicates = new Set<number>()
  for (const row of rows) {
    const key = `${row.source.toLowerCase()}||${row.target.toLowerCase()}`
    if (existingKeys.has(key)) {
      duplicates.add(row.lineNumber)
    }
  }

  return duplicates
}
