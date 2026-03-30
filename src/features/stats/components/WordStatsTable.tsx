/**
 * WordStatsTable - per-word stats with sorting and confidence-bucket filtering.
 *
 * Columns: Word (source → target), Times reviewed, Accuracy, Confidence, Last reviewed
 * Sortable by any column. Filterable by confidence bucket.
 */

import { useMemo, useState } from 'react'
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import type { ConfidenceBucket, WordWithStats } from '../utils/confidenceBuckets'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WordStatsTableProps {
  readonly wordStats: readonly WordWithStats[]
  readonly loading: boolean
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortColumn = 'word' | 'timesReviewed' | 'correctPct' | 'confidence' | 'lastReviewed'
type SortDirection = 'asc' | 'desc'
type BucketFilter = ConfidenceBucket | 'all'

// ─── Constants ────────────────────────────────────────────────────────────────

const BUCKET_COLORS: Record<ConfidenceBucket, string> = {
  learning: 'error',
  familiar: 'warning',
  mastered: 'success',
}

const ROWS_PER_PAGE = 50

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastReviewed(ts: number | null): string {
  if (ts === null) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function sortWordStats(
  stats: readonly WordWithStats[],
  col: SortColumn,
  dir: SortDirection,
): WordWithStats[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...stats].sort((a, b) => {
    switch (col) {
      case 'word':
        return sign * a.word.source.localeCompare(b.word.source)
      case 'timesReviewed':
        return sign * (a.timesReviewed - b.timesReviewed)
      case 'correctPct': {
        const aPct = a.correctPct ?? -1
        const bPct = b.correctPct ?? -1
        return sign * (aPct - bPct)
      }
      case 'confidence':
        return sign * (a.confidence - b.confidence)
      case 'lastReviewed': {
        const aTs = a.lastReviewed ?? -1
        const bTs = b.lastReviewed ?? -1
        return sign * (aTs - bTs)
      }
      default:
        return 0
    }
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WordStatsTable({ wordStats, loading }: WordStatsTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn>('confidence')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('all')

  const handleSort = (col: SortColumn) => {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const handleFilterChange = (e: SelectChangeEvent<BucketFilter>) => {
    setBucketFilter(e.target.value as BucketFilter)
  }

  const filtered = useMemo(
    () =>
      bucketFilter === 'all' ? wordStats : wordStats.filter((ws) => ws.bucket === bucketFilter),
    [wordStats, bucketFilter],
  )

  const sorted = useMemo(
    () => sortWordStats(filtered, sortCol, sortDir),
    [filtered, sortCol, sortDir],
  )

  const displayed = sorted.slice(0, ROWS_PER_PAGE)

  const SortLabel = ({ col, children }: { col: SortColumn; children: React.ReactNode }) => (
    <TableSortLabel
      active={sortCol === col}
      direction={sortCol === col ? sortDir : 'asc'}
      onClick={() => handleSort(col)}
    >
      {children}
    </TableSortLabel>
  )

  return (
    <Box
      sx={{
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        borderRadius: 3,
        p: 2.5,
        overflow: 'auto',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Word progress
        </Typography>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="bucket-filter-label">Filter</InputLabel>
          <Select
            labelId="bucket-filter-label"
            value={bucketFilter}
            label="Filter"
            onChange={handleFilterChange}
            aria-label="Filter words by confidence level"
          >
            <MenuItem value="all">All words</MenuItem>
            <MenuItem value="learning">Learning</MenuItem>
            <MenuItem value="familiar">Familiar</MenuItem>
            <MenuItem value="mastered">Mastered</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={36} />
          ))}
        </Box>
      ) : wordStats.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No words to display. Add words and complete quizzes to track your progress.
        </Typography>
      ) : (
        <>
          <TableContainer>
            <Table size="small" aria-label="Word progress table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <SortLabel col="word">Word</SortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <SortLabel col="timesReviewed">Reviews</SortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <SortLabel col="correctPct">Accuracy</SortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <SortLabel col="confidence">Confidence</SortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <SortLabel col="lastReviewed">Last reviewed</SortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(
                  ({ word, bucket, timesReviewed, correctPct, confidence, lastReviewed }) => (
                    <TableRow key={word.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 140 }}>
                          {word.source}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ maxWidth: 140 }}
                        >
                          {word.target}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{timesReviewed}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {correctPct !== null ? `${correctPct}%` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Chip
                            label={bucket}
                            size="small"
                            color={BUCKET_COLORS[bucket] as 'error' | 'warning' | 'success'}
                            aria-label={`${word.source}: ${bucket} confidence`}
                            sx={{ textTransform: 'capitalize', minWidth: 72 }}
                          />
                          <LinearProgress
                            variant="determinate"
                            value={confidence * 100}
                            color={BUCKET_COLORS[bucket] as 'error' | 'warning' | 'success'}
                            sx={{ width: 60, height: 4, borderRadius: 2 }}
                            aria-hidden="true"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatLastReviewed(lastReviewed)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {sorted.length > ROWS_PER_PAGE && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing {ROWS_PER_PAGE} of {sorted.length} words
            </Typography>
          )}

          {filtered.length === 0 && bucketFilter !== 'all' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No words in the &ldquo;{bucketFilter}&rdquo; bucket.
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}
