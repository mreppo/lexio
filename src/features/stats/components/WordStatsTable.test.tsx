import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { theme } from '@/theme'
import { WordStatsTable } from './WordStatsTable'
import type { WordWithStats } from '../utils/confidenceBuckets'
import type { Word } from '@/types'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeWord(id: string, source: string, target: string): Word {
  return {
    id,
    pairId: 'pair-1',
    source,
    target,
    notes: null,
    tags: [],
    createdAt: 1000,
    isFromPack: false,
  }
}

function makeWordStat(
  id: string,
  source: string,
  target: string,
  bucket: WordWithStats['bucket'],
  confidence: number,
  timesReviewed = 5,
): WordWithStats {
  return {
    word: makeWord(id, source, target),
    progress: null,
    bucket,
    timesReviewed,
    correctPct: timesReviewed > 0 ? 80 : null,
    confidence,
    lastReviewed: 1700000000000,
  }
}

const sampleStats: WordWithStats[] = [
  makeWordStat('w1', 'apple', 'ābols', 'mastered', 0.9),
  makeWordStat('w2', 'cat', 'kaķis', 'learning', 0.1),
  makeWordStat('w3', 'dog', 'suns', 'familiar', 0.55),
  makeWordStat('w4', 'bird', 'putns', 'learning', 0.2),
]

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WordStatsTable', () => {
  it('should render without crashing', () => {
    wrap(<WordStatsTable wordStats={sampleStats} loading={false} />)
    expect(screen.getByText('Word progress')).toBeInTheDocument()
  })

  it('should show empty state when wordStats is empty', () => {
    wrap(<WordStatsTable wordStats={[]} loading={false} />)
    expect(screen.getByText(/No words to display/i)).toBeInTheDocument()
  })

  it('should render a row for each word', () => {
    wrap(<WordStatsTable wordStats={sampleStats} loading={false} />)
    expect(screen.getByText('apple')).toBeInTheDocument()
    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText('dog')).toBeInTheDocument()
    expect(screen.getByText('bird')).toBeInTheDocument()
  })

  it('should show target word translations', () => {
    wrap(<WordStatsTable wordStats={sampleStats} loading={false} />)
    expect(screen.getByText('ābols')).toBeInTheDocument()
    expect(screen.getByText('kaķis')).toBeInTheDocument()
  })

  it('should render a filter dropdown', () => {
    wrap(<WordStatsTable wordStats={sampleStats} loading={false} />)
    expect(screen.getByLabelText(/filter words by confidence level/i)).toBeInTheDocument()
  })

  it('should filter to show only learning words', async () => {
    const user = userEvent.setup()
    wrap(<WordStatsTable wordStats={sampleStats} loading={false} />)

    // Open the MUI select by clicking the combobox
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Learning' }))

    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText('bird')).toBeInTheDocument()
    expect(screen.queryByText('apple')).not.toBeInTheDocument()
    expect(screen.queryByText('dog')).not.toBeInTheDocument()
  })

  it('should filter to show only mastered words', async () => {
    const user = userEvent.setup()
    wrap(<WordStatsTable wordStats={sampleStats} loading={false} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Mastered' }))

    expect(screen.getByText('apple')).toBeInTheDocument()
    expect(screen.queryByText('cat')).not.toBeInTheDocument()
  })

  it('should show message for empty bucket filter result', async () => {
    const user = userEvent.setup()
    // All words are learning - filter for familiar should show message
    const learningOnly = sampleStats.filter((w) => w.bucket === 'learning')
    wrap(<WordStatsTable wordStats={learningOnly} loading={false} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Familiar' }))

    expect(screen.getByText(/No words in the .* bucket/i)).toBeInTheDocument()
  })

  it('should render sortable column headers', () => {
    wrap(<WordStatsTable wordStats={sampleStats} loading={false} />)
    expect(screen.getByText('Word')).toBeInTheDocument()
    expect(screen.getByText('Reviews')).toBeInTheDocument()
    expect(screen.getByText('Accuracy')).toBeInTheDocument()
    expect(screen.getByText('Confidence')).toBeInTheDocument()
  })

  it('should sort by word ascending when Word column is clicked', async () => {
    const user = userEvent.setup()
    wrap(<WordStatsTable wordStats={sampleStats} loading={false} />)

    await user.click(screen.getByText('Word'))

    const rows = screen.getAllByRole('row')
    // First data row (after header) should be 'apple' (alphabetically first)
    expect(rows[1]).toHaveTextContent('apple')
  })

  it('should show skeleton loaders when loading', () => {
    const { container } = wrap(<WordStatsTable wordStats={[]} loading={true} />)
    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render confidence chip with correct label', () => {
    wrap(<WordStatsTable wordStats={[sampleStats[0]]} loading={false} />)
    // mastered chip
    expect(screen.getByText('mastered')).toBeInTheDocument()
  })

  it('should display dash for unreviewed words accuracy', () => {
    const unreviewedStat: WordWithStats = makeWordStat('w5', 'tree', 'koks', 'learning', 0, 0)
    wrap(<WordStatsTable wordStats={[unreviewedStat]} loading={false} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
