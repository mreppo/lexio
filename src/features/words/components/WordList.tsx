import { useState, useMemo, useCallback } from 'react'
import {
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
  Toolbar,
  Checkbox,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SortIcon from '@mui/icons-material/Sort'
import DeleteIcon from '@mui/icons-material/Delete'
import type { Word, WordProgress } from '@/types'
import { SORT_OPTIONS, WORD_FILTERS, CONFIDENCE_FILTERS, getConfidenceBucket } from '../constants'
import type { SortOption, WordFilter, ConfidenceFilter } from '../constants'
import { WordListItem } from './WordListItem'
import { DeleteWordDialog } from './DeleteWordDialog'

export interface WordListProps {
  readonly words: readonly Word[]
  readonly progressMap: ReadonlyMap<string, WordProgress>
  readonly onEdit: (word: Word) => void
  readonly onDelete: (wordId: string) => Promise<void>
  readonly onBulkDelete: (wordIds: readonly string[]) => Promise<void>
}

/**
 * Full word list with search, filter, sort and bulk-selection controls.
 */
export function WordList({ words, progressMap, onEdit, onDelete, onBulkDelete }: WordListProps) {
  const [search, setSearch] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('date-desc')
  const [wordFilter, setWordFilter] = useState<WordFilter>('all')
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all')
  const [activeTags, setActiveTags] = useState<string[]>([])

  // Selection state for bulk delete.
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Delete confirmation state.
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [wordToDelete, setWordToDelete] = useState<Word | null>(null)

  // Collect all unique tags from the word list.
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const word of words) {
      for (const tag of word.tags) tagSet.add(tag)
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  }, [words])

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase()

    return [...words]
      .filter((w) => {
        // Text search
        if (q && !w.source.toLowerCase().includes(q) && !w.target.toLowerCase().includes(q)) {
          return false
        }
        // Word filter
        if (wordFilter === 'user-added' && w.isFromPack) return false
        if (wordFilter === 'from-pack' && !w.isFromPack) return false
        // Tag filter
        if (activeTags.length > 0 && !activeTags.every((t) => w.tags.includes(t))) return false
        // Confidence filter
        if (confidenceFilter !== 'all') {
          const progress = progressMap.get(w.id) ?? null
          const bucket = getConfidenceBucket(progress?.confidence ?? null)
          if (bucket !== confidenceFilter) return false
        }
        return true
      })
      .sort((a, b) => {
        const progA = progressMap.get(a.id)
        const progB = progressMap.get(b.id)
        switch (sortOption) {
          case 'source-asc':
            return a.source.localeCompare(b.source)
          case 'source-desc':
            return b.source.localeCompare(a.source)
          case 'target-asc':
            return a.target.localeCompare(b.target)
          case 'target-desc':
            return b.target.localeCompare(a.target)
          case 'date-asc':
            return a.createdAt - b.createdAt
          case 'date-desc':
            return b.createdAt - a.createdAt
          case 'confidence-asc':
            return (progA?.confidence ?? 0) - (progB?.confidence ?? 0)
          case 'confidence-desc':
            return (progB?.confidence ?? 0) - (progA?.confidence ?? 0)
          default:
            return 0
        }
      })
  }, [words, search, sortOption, wordFilter, confidenceFilter, activeTags, progressMap])

  const handleToggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }, [])

  const handleToggleSelect = useCallback((wordId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(wordId)) next.delete(wordId)
      else next.add(wordId)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAndSorted.map((w) => w.id)))
    }
  }, [selectedIds.size, filteredAndSorted])

  const handleEnterSelectionMode = useCallback(() => {
    setSelectionMode(true)
    setSelectedIds(new Set())
  }, [])

  const handleExitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleDeleteSingle = useCallback((word: Word) => {
    setWordToDelete(word)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDeleteSingle = useCallback(async () => {
    if (wordToDelete) {
      await onDelete(wordToDelete.id)
      setWordToDelete(null)
    }
  }, [wordToDelete, onDelete])

  const handleBulkDeleteRequest = useCallback(() => {
    if (selectedIds.size > 0) {
      setDeleteDialogOpen(true)
    }
  }, [selectedIds.size])

  const handleConfirmBulkDelete = useCallback(async () => {
    await onBulkDelete(Array.from(selectedIds))
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [onBulkDelete, selectedIds])

  const handleDeleteDialogClose = useCallback(() => {
    setDeleteDialogOpen(false)
    setWordToDelete(null)
  }, [])

  const isBulkDelete = wordToDelete === null
  const allVisibleSelected =
    filteredAndSorted.length > 0 && selectedIds.size === filteredAndSorted.length

  return (
    <Box>
      {/* Search and controls bar */}
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words…"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          inputProps={{ 'aria-label': 'Search words' }}
        />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="sort-label">
              <SortIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              Sort
            </InputLabel>
            <Select
              labelId="sort-label"
              value={sortOption}
              label="Sort"
              onChange={(e) => setSortOption(e.target.value as SortOption)}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="filter-label">Filter</InputLabel>
            <Select
              labelId="filter-label"
              value={wordFilter}
              label="Filter"
              onChange={(e) => setWordFilter(e.target.value as WordFilter)}
            >
              {WORD_FILTERS.map((f) => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="confidence-label">Confidence</InputLabel>
            <Select
              labelId="confidence-label"
              value={confidenceFilter}
              label="Confidence"
              onChange={(e) => setConfidenceFilter(e.target.value as ConfidenceFilter)}
            >
              {CONFIDENCE_FILTERS.map((f) => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {allTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onClick={() => handleToggleTag(tag)}
                color={activeTags.includes(tag) ? 'primary' : 'default'}
                variant={activeTags.includes(tag) ? 'filled' : 'outlined'}
                aria-pressed={activeTags.includes(tag)}
              />
            ))}
          </Box>
        )}
      </Stack>

      {/* Result count + bulk controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
          minHeight: 32,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {filteredAndSorted.length} word{filteredAndSorted.length !== 1 ? 's' : ''}
          {words.length !== filteredAndSorted.length && ` (of ${words.length})`}
        </Typography>

        {!selectionMode && filteredAndSorted.length > 0 && (
          <Button size="small" variant="text" onClick={handleEnterSelectionMode}>
            Select
          </Button>
        )}

        {selectionMode && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedIds.size > 0 && (
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDeleteRequest}
              >
                Delete ({selectedIds.size})
              </Button>
            )}
            <Button size="small" variant="text" onClick={handleExitSelectionMode}>
              Cancel
            </Button>
          </Box>
        )}
      </Box>

      {/* Word list */}
      {filteredAndSorted.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No words match your search or filters.
          </Typography>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          {selectionMode && (
            <>
              <Toolbar variant="dense" sx={{ pl: 1, minHeight: 40 }}>
                <Checkbox
                  checked={allVisibleSelected}
                  indeterminate={selectedIds.size > 0 && !allVisibleSelected}
                  onChange={handleSelectAll}
                  inputProps={{ 'aria-label': 'Select all visible words' }}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                </Typography>
              </Toolbar>
              <Divider />
            </>
          )}
          <List disablePadding>
            {filteredAndSorted.map((word, index) => (
              <Box key={word.id}>
                {index > 0 && <Divider component="li" />}
                <WordListItem
                  word={word}
                  progress={progressMap.get(word.id) ?? null}
                  selected={selectedIds.has(word.id)}
                  selectionMode={selectionMode}
                  onToggleSelect={handleToggleSelect}
                  onEdit={onEdit}
                  onDelete={handleDeleteSingle}
                />
              </Box>
            ))}
          </List>
        </Paper>
      )}

      <DeleteWordDialog
        open={deleteDialogOpen}
        count={isBulkDelete ? selectedIds.size : 1}
        wordLabel={wordToDelete?.source}
        onClose={handleDeleteDialogClose}
        onConfirm={isBulkDelete ? handleConfirmBulkDelete : handleConfirmDeleteSingle}
      />
    </Box>
  )
}
