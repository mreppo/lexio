import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfidenceSummary } from './ConfidenceSummary'
import type { BucketCounts } from '../utils/confidenceBuckets'

const emptyBuckets: BucketCounts = { struggling: 0, learning: 0, mastered: 0, total: 0 }

const filledBuckets: BucketCounts = { struggling: 5, learning: 3, mastered: 2, total: 10 }

describe('ConfidenceSummary', () => {
  it('should render without crashing', () => {
    render(<ConfidenceSummary buckets={emptyBuckets} loading={false} />)
    expect(screen.getByText('Word confidence')).toBeInTheDocument()
  })

  it('should show empty state message when total is 0', () => {
    render(<ConfidenceSummary buckets={emptyBuckets} loading={false} />)
    expect(screen.getByText(/No words added yet/i)).toBeInTheDocument()
  })

  it('should render bucket counts when data is present', () => {
    render(<ConfidenceSummary buckets={filledBuckets} loading={false} />)
    expect(screen.getByText('5')).toBeInTheDocument() // struggling count
    expect(screen.getByText('3')).toBeInTheDocument() // learning count
    expect(screen.getByText('2')).toBeInTheDocument() // mastered count
  })

  it('should display the bucket labels', () => {
    render(<ConfidenceSummary buckets={filledBuckets} loading={false} />)
    expect(screen.getByText('Struggling')).toBeInTheDocument()
    expect(screen.getByText('Learning')).toBeInTheDocument()
    expect(screen.getByText('Mastered')).toBeInTheDocument()
  })

  it('should show total words count', () => {
    render(<ConfidenceSummary buckets={filledBuckets} loading={false} />)
    expect(screen.getByText('10 words total')).toBeInTheDocument()
  })

  it('should show the mastered percentage', () => {
    render(<ConfidenceSummary buckets={filledBuckets} loading={false} />)
    expect(screen.getByText(/20% mastered/i)).toBeInTheDocument()
  })

  it('should render skeleton loaders when loading', () => {
    const { container } = render(<ConfidenceSummary buckets={emptyBuckets} loading={true} />)
    // MUI Skeleton renders as a span with aria-busy
    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should have accessible list labels for bucket items', () => {
    render(<ConfidenceSummary buckets={filledBuckets} loading={false} />)
    expect(screen.getByRole('list', { name: 'Confidence bucket summary' })).toBeInTheDocument()
  })

  it('should show 100% mastered when all words are mastered', () => {
    const allMastered: BucketCounts = { struggling: 0, learning: 0, mastered: 10, total: 10 }
    render(<ConfidenceSummary buckets={allMastered} loading={false} />)
    expect(screen.getByText(/100% mastered/i)).toBeInTheDocument()
  })
})
