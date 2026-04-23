/**
 * LibraryScreen — Liquid Glass "Library" (Words) screen (issue #149).
 *
 * Layout (top to bottom):
 *   1. NavBar large prominentTitle="Library" — trailing: search GlassIcon + plus GlassIcon
 *   2. Glass search field (radius 16, height 40) with debounced 150ms filter
 *   3. Filter pills row (All / Due / Learning / Mastered) — mutually exclusive
 *   4. Grouped word list padded 0 0 140 — each group: SectionHeader + Glass + GlassRow per word
 *   5. TabBar active=words (rendered by AppContent, not here)
 *
 * The plus button wires to the existing WordFormDialog add flow (a dialog, not a
 * modal sheet). #150 will restyle Add Word and may convert it to a bottom sheet.
 *
 * Search debounce: 150ms via useDebounce hook.
 * Grouping: alphabetical by first character of `source` term (locale-sensitive).
 * Filter pills count: based on classifyBucket + due-date logic.
 *
 * useWords hook is NOT modified — render layer only.
 */

import { useState, useMemo, useCallback } from 'react'
import { Box } from '@mui/material'
import { Search, Plus, BookOpen, LibraryBig } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import type { LanguagePair, Word, WordProgress } from '@/types'
import { PaperSurface } from '@/components/primitives'
import { NavBar, SectionHeader } from '@/components/composites'
import { Glass } from '@/components/primitives/Glass'
import { GlassRow } from '@/components/composites/GlassRow'
import { GlassIcon } from '@/components/atoms/GlassIcon'
import { IconGlyph } from '@/components/atoms/IconGlyph'
import { FilterPill } from '@/components/atoms/FilterPill'
import { TabBar } from '@/components/composites/TabBar'
import type { AppTab } from '@/components/composites/TabBar'
import { getGlassTokens, glassTypography, glassShadows } from '@/theme/liquidGlass'
import { useWords } from '../useWords'
import type { CreateWordInput } from '../useWords'
import { classifyBucket } from '../buckets'
import type { WordBucket } from '../buckets'
import { WordFormDialog } from './WordFormDialog'
import { AddWordModal } from './AddWordModal'
import { PackBrowserDialog } from '@/features/starter-packs'
import { useDebounce } from '@/hooks/useDebounce'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Bottom spacer height in px — clears the fixed TabBar per spec. */
const BOTTOM_SPACER_PX = 140

/** Debounce delay for the search field in ms. */
const SEARCH_DEBOUNCE_MS = 150

// ─── Types ────────────────────────────────────────────────────────────────────

/** Filter pill options for the Library screen. */
type LibraryFilter = 'all' | 'due' | 'learning' | 'mastered'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LibraryScreenProps {
  /** The currently active language pair. */
  readonly activePair: LanguagePair | null
  /** Called when the user switches tabs. */
  readonly onTabChange: (tab: AppTab) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determine if a word is due for review (nextReview <= now, or no progress record).
 * Mirrors the same logic in DashboardScreen and QuizHub.
 */
function isDue(wordId: string, progressMap: ReadonlyMap<string, WordProgress>): boolean {
  const progress = progressMap.get(wordId)
  if (progress === undefined) return true
  return progress.nextReview <= Date.now()
}

/**
 * Apply the active filter to a word.
 * 'due' uses due-date logic; the others use bucket classification.
 */
function wordMatchesFilter(
  word: Word,
  filter: LibraryFilter,
  progressMap: ReadonlyMap<string, WordProgress>,
): boolean {
  if (filter === 'all') return true
  if (filter === 'due') return isDue(word.id, progressMap)

  const progress = progressMap.get(word.id)
  const confidence = progress?.confidence ?? null
  const bucket = classifyBucket(confidence)

  if (filter === 'mastered') return bucket === 'mastered'
  // 'learning' bucket maps to both 'new' and 'learning' words
  if (filter === 'learning') return bucket === 'learning' || bucket === 'new'
  return false
}

/**
 * Case-insensitive substring search across term and meaning.
 * Uses locale-aware lowercasing to handle Latvian diacritics correctly.
 */
function wordMatchesSearch(word: Word, query: string): boolean {
  if (query === '') return true
  const q = query.toLocaleLowerCase()
  return word.source.toLocaleLowerCase().includes(q) || word.target.toLocaleLowerCase().includes(q)
}

/**
 * Group words alphabetically by the first character of `source`.
 * Returns an array of [letter, words[]] pairs sorted by letter.
 * Locale-sensitive — preserves the existing sort convention from the word list.
 */
function groupByLetter(words: readonly Word[]): ReadonlyArray<readonly [string, readonly Word[]]> {
  const map = new Map<string, Word[]>()

  for (const word of words) {
    // First character uppercased; fallback to '#' for empty strings
    const letter = word.source.length > 0 ? word.source[0].toLocaleUpperCase() : '#'
    if (!map.has(letter)) {
      map.set(letter, [])
    }
    map.get(letter)!.push(word)
  }

  // Sort the groups by their letter key (locale-sensitive)
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)) as ReadonlyArray<
    readonly [string, readonly Word[]]
  >
}

/** Count words matching each filter category for the pill badges. */
function computeFilterCounts(
  words: readonly Word[],
  progressMap: ReadonlyMap<string, WordProgress>,
): Record<LibraryFilter, number> {
  let due = 0
  let learning = 0
  let mastered = 0

  for (const word of words) {
    const progress = progressMap.get(word.id)
    const confidence = progress?.confidence ?? null
    const bucket = classifyBucket(confidence)

    if (isDue(word.id, progressMap)) due++
    if (bucket === 'learning' || bucket === 'new') learning++
    if (bucket === 'mastered') mastered++
  }

  return { all: words.length, due, learning, mastered }
}

/** Map a word bucket to the icon background colour token. */
function bucketIconColor(bucket: WordBucket, tokens: ReturnType<typeof getGlassTokens>): string {
  switch (bucket) {
    case 'mastered':
      return tokens.color.ok
    case 'familiar':
      return tokens.color.accent
    case 'learning':
      return tokens.color.warn
    case 'new':
      return tokens.color.accent
  }
}

/** Map a word bucket to the score chip rim/text colour token. */
function bucketScoreColor(bucket: WordBucket, tokens: ReturnType<typeof getGlassTokens>): string {
  switch (bucket) {
    case 'mastered':
      return tokens.color.ok
    case 'familiar':
      return tokens.color.accent
    case 'learning':
      return tokens.color.warn
    case 'new':
      return tokens.color.accent
  }
}

/** Short label for the score chip. */
function bucketLabel(bucket: WordBucket): string {
  switch (bucket) {
    case 'mastered':
      return 'Mastered'
    case 'familiar':
      return 'Familiar'
    case 'learning':
      return 'Learning'
    case 'new':
      return 'New'
  }
}

// ─── Score Chip ───────────────────────────────────────────────────────────────

interface ScoreChipProps {
  readonly bucket: WordBucket
}

/**
 * Inline score chip accessory for word rows.
 * Glass fill with a thin rim; text is inkSoft 12/700; rim colour maps to bucket state.
 * Dimensions: height 22, padding 0 10, radius 999.
 */
function ScoreChip({ bucket }: ScoreChipProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)
  const rimColor = bucketScoreColor(bucket, tokens)
  const label = bucketLabel(bucket)

  return (
    <Box
      component="span"
      aria-label={`Score: ${label}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '22px',
        padding: '0 10px',
        borderRadius: '999px',
        // Glass fill
        backgroundColor: tokens.glass.bg,
        backdropFilter: 'blur(10px) saturate(150%)',
        WebkitBackdropFilter: 'blur(10px) saturate(150%)',
        // Rim coloured by bucket state
        border: `0.5px solid ${rimColor}`,
        // inkSoft text 12/700
        fontFamily: glassTypography.body,
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '-0.1px',
        lineHeight: 1,
        color: tokens.color.inkSoft,
        flexShrink: 0,
        '@media (prefers-reduced-transparency: reduce)': {
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          backgroundColor: tokens.color.bg,
          border: `0.5px solid ${rimColor}`,
        },
      }}
    >
      {label}
    </Box>
  )
}

// ─── Search field ─────────────────────────────────────────────────────────────

interface SearchFieldProps {
  readonly value: string
  readonly onChange: (v: string) => void
  readonly totalWordCount: number
}

/**
 * Glass search field: radius 16, content height 40, padding 0 14, gap 8.
 * Search icon 16px inkSec stroke 2.2. Placeholder "Search {N} words" where N=total.
 */
function SearchField({ value, onChange, totalWordCount }: SearchFieldProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box sx={{ px: '16px' }}>
      <Glass pad={0} floating radius={16}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: '40px',
            px: '14px',
            gap: '8px',
          }}
        >
          <Search
            size={16}
            color={tokens.color.inkSec}
            strokeWidth={2.2}
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          />
          <Box
            component="input"
            type="search"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            placeholder={`Search ${totalWordCount} word${totalWordCount !== 1 ? 's' : ''}`}
            aria-label={`Search ${totalWordCount} words`}
            sx={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: glassTypography.body,
              fontSize: '15px',
              fontWeight: 500,
              letterSpacing: '-0.2px',
              color: tokens.color.ink,
              '&::placeholder': {
                color: tokens.color.inkSec,
              },
              // Remove browser search clear button (Chrome/Safari)
              '&::-webkit-search-cancel-button': { display: 'none' },
            }}
          />
        </Box>
      </Glass>
    </Box>
  )
}

// ─── Filter Pills Row ─────────────────────────────────────────────────────────

interface FilterPillsRowProps {
  readonly activeFilter: LibraryFilter
  readonly counts: Record<LibraryFilter, number>
  readonly onFilterChange: (f: LibraryFilter) => void
}

/**
 * Horizontal scrollable filter pill row.
 * Padding: 6 16 8. Gap: 8. Pills: All · Due · Learning · Mastered.
 */
function FilterPillsRow({
  activeFilter,
  counts,
  onFilterChange,
}: FilterPillsRowProps): React.JSX.Element {
  const pills: ReadonlyArray<{ readonly key: LibraryFilter; readonly label: string }> = [
    { key: 'all', label: `All · ${counts.all}` },
    { key: 'due', label: `Due · ${counts.due}` },
    { key: 'learning', label: `Learning · ${counts.learning}` },
    { key: 'mastered', label: `Mastered · ${counts.mastered}` },
  ]

  return (
    <Box
      role="group"
      aria-label="Filter words"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto',
        // Padding: 6 top, 16 sides, 8 bottom per spec
        pt: '6px',
        px: '16px',
        pb: '8px',
        gap: '8px',
        // Hide scrollbar while keeping scrollability
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {pills.map(({ key, label }) => (
        <FilterPill
          key={key}
          active={activeFilter === key}
          onClick={() => onFilterChange(key)}
          aria-label={`Filter: ${label}`}
        >
          {label}
        </FilterPill>
      ))}
    </Box>
  )
}

// ─── Grouped Word List ────────────────────────────────────────────────────────

interface GroupedWordListProps {
  readonly groups: ReadonlyArray<readonly [string, readonly Word[]]>
  readonly progressMap: ReadonlyMap<string, WordProgress>
  readonly onWordTap: (word: Word) => void
}

function GroupedWordList({
  groups,
  progressMap,
  onWordTap,
}: GroupedWordListProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  if (groups.length === 0) {
    return (
      <Box
        sx={{
          py: '32px',
          textAlign: 'center',
          fontFamily: glassTypography.body,
          fontSize: '15px',
          fontWeight: 500,
          color: tokens.color.inkSec,
        }}
      >
        No words match your search or filter.
      </Box>
    )
  }

  return (
    <Box>
      {groups.map(([letter, groupWords]) => (
        <Box key={letter}>
          <SectionHeader>{letter}</SectionHeader>
          <Box sx={{ px: '16px' }}>
            <Glass pad={0} floating>
              {groupWords.map((word, index) => {
                const progress = progressMap.get(word.id)
                const confidence = progress?.confidence ?? null
                const bucket = classifyBucket(confidence)
                const iconBg = bucketIconColor(bucket, tokens)
                const isLast = index === groupWords.length - 1

                return (
                  <GlassRow
                    key={word.id}
                    icon={BookOpen}
                    iconBg={iconBg}
                    title={word.source}
                    detail={word.target}
                    accessory={<ScoreChip bucket={bucket} />}
                    isLast={isLast}
                    onClick={() => onWordTap(word)}
                  />
                )
              })}
            </Glass>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyLibraryProps {
  readonly onAddWord: () => void
  readonly onOpenPacks: () => void
}

function EmptyLibrary({ onAddWord, onOpenPacks }: EmptyLibraryProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const ctaButtonSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    borderRadius: '18px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: glassTypography.body,
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '-0.2px',
    transition: 'opacity 150ms ease, transform 150ms ease',
    '&:active': { opacity: 0.85, transform: 'scale(0.97)' },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      '&:active': { transform: 'none' },
    },
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        py: '48px',
        px: '24px',
        textAlign: 'center',
      }}
    >
      <Box
        component="p"
        sx={{
          margin: 0,
          fontFamily: glassTypography.body,
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '-0.4px',
          color: tokens.color.ink,
        }}
      >
        No words yet
      </Box>
      <Box
        component="p"
        sx={{
          margin: 0,
          fontFamily: glassTypography.body,
          fontSize: '15px',
          fontWeight: 500,
          color: tokens.color.inkSec,
          maxWidth: '280px',
          lineHeight: 1.5,
        }}
      >
        Add your first word or install a starter pack to get going quickly.
      </Box>
      <Box
        sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', mt: '8px' }}
      >
        <Box
          component="button"
          type="button"
          onClick={onAddWord}
          sx={{
            ...ctaButtonSx,
            backgroundColor: tokens.color.accent,
            color: '#ffffff',
            boxShadow: glassShadows.accentBtn,
          }}
        >
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          Add word
        </Box>
        <Box
          component="button"
          type="button"
          onClick={onOpenPacks}
          aria-label="Starter packs"
          sx={{
            ...ctaButtonSx,
            backgroundColor: tokens.glass.bg,
            color: tokens.color.ink,
            backdropFilter: 'blur(10px) saturate(150%)',
            WebkitBackdropFilter: 'blur(10px) saturate(150%)',
            border: `0.5px solid ${tokens.glass.border}`,
            '@media (prefers-reduced-transparency: reduce)': {
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              backgroundColor: tokens.color.bg,
            },
          }}
        >
          <LibraryBig size={16} strokeWidth={2} aria-hidden="true" />
          Starter packs
        </Box>
      </Box>
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LibraryScreen({ activePair, onTabChange }: LibraryScreenProps): React.JSX.Element {
  const { words, progressMap, loading, updateWord, refresh } = useWords(activePair?.id ?? null)

  // Search state — raw value from input, debounced value for filtering
  const [searchRaw, setSearchRaw] = useState('')
  const searchQuery = useDebounce(searchRaw, SEARCH_DEBOUNCE_MS)

  // Filter pill state — mutually exclusive
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all')

  // Add Word modal state — new Liquid Glass modal for adding new words (#150)
  const [addWordOpen, setAddWordOpen] = useState(false)

  // Edit word dialog state — existing WordFormDialog used for editing only
  const [formOpen, setFormOpen] = useState(false)
  const [wordToEdit, setWordToEdit] = useState<Word | null>(null)

  // Pack browser dialog state
  const [packBrowserOpen, setPackBrowserOpen] = useState(false)

  const handleOpenAdd = useCallback(() => {
    setAddWordOpen(true)
  }, [])

  const handleCloseAddWord = useCallback(() => {
    setAddWordOpen(false)
    // Re-fetch words after the modal closes in case a word was added
    refresh()
  }, [refresh])

  const handleOpenEdit = useCallback((word: Word) => {
    setWordToEdit(word)
    setFormOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setFormOpen(false)
    setWordToEdit(null)
  }, [])

  const handleOpenPacks = useCallback(() => {
    setPackBrowserOpen(true)
  }, [])

  const handleClosePacks = useCallback(() => {
    setPackBrowserOpen(false)
  }, [])

  const handlePackInstalled = useCallback(() => {
    refresh()
  }, [refresh])

  // handleSubmit is used only by the edit WordFormDialog.
  // New words are added via AddWordModal (#150).
  const handleSubmit = useCallback(
    async (input: CreateWordInput): Promise<boolean> => {
      if (!wordToEdit) return false
      await updateWord(wordToEdit.id, input)
      return true
    },
    [wordToEdit, updateWord],
  )

  // Per-filter counts for pill badges
  const filterCounts = useMemo(() => computeFilterCounts(words, progressMap), [words, progressMap])

  // Filtered and grouped word list
  const filteredGroups = useMemo(() => {
    const filtered = words.filter(
      (w) => wordMatchesFilter(w, activeFilter, progressMap) && wordMatchesSearch(w, searchQuery),
    )

    // Sort within each group by source term (locale-sensitive), then group
    const sorted = [...filtered].sort((a, b) => a.source.localeCompare(b.source))
    return groupByLetter(sorted)
  }, [words, activeFilter, progressMap, searchQuery])

  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  // No active pair
  if (!activePair) {
    return (
      <PaperSurface sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh',
            px: '24px',
            textAlign: 'center',
          }}
        >
          <Box
            component="p"
            sx={{
              margin: 0,
              fontFamily: glassTypography.body,
              fontSize: '17px',
              fontWeight: 500,
              color: tokens.color.inkSec,
            }}
          >
            Select a language pair to browse your library.
          </Box>
        </Box>
        <TabBar activeTab="words" onTabChange={onTabChange} />
      </PaperSurface>
    )
  }

  // Loading state
  if (loading) {
    return (
      <PaperSurface sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
        <NavBar large prominentTitle="Library" />
        <TabBar activeTab="words" onTabChange={onTabChange} />
      </PaperSurface>
    )
  }

  return (
    <PaperSurface sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
      <Box
        role="main"
        aria-label="Library"
        sx={{ display: 'flex', flexDirection: 'column', pb: `${BOTTOM_SPACER_PX}px` }}
      >
        {/* NavBar: large, Library title, search + plus trailing icons */}
        <NavBar
          large
          prominentTitle="Library"
          trailing={
            <Box sx={{ display: 'flex', gap: '8px' }}>
              <GlassIcon as="button" aria-label="Search" onClick={() => {}} size={44}>
                <IconGlyph name="search" size={16} color={tokens.color.inkSec} decorative />
              </GlassIcon>
              <GlassIcon as="button" aria-label="Add word" onClick={handleOpenAdd} size={44}>
                <Plus size={16} color={tokens.color.accent} strokeWidth={2.4} aria-hidden="true" />
              </GlassIcon>
            </Box>
          }
        />

        {/* Empty state when no words */}
        {words.length === 0 ? (
          <EmptyLibrary onAddWord={handleOpenAdd} onOpenPacks={handleOpenPacks} />
        ) : (
          <>
            {/* Search field */}
            <SearchField value={searchRaw} onChange={setSearchRaw} totalWordCount={words.length} />

            {/* Filter pills */}
            <FilterPillsRow
              activeFilter={activeFilter}
              counts={filterCounts}
              onFilterChange={setActiveFilter}
            />

            {/* Grouped word list */}
            <GroupedWordList
              groups={filteredGroups}
              progressMap={progressMap}
              onWordTap={handleOpenEdit}
            />
          </>
        )}
      </Box>

      {/* Tab bar */}
      <TabBar activeTab="words" onTabChange={onTabChange} />

      {/* Add Word modal — Liquid Glass full-screen modal (#150) */}
      <AddWordModal
        open={addWordOpen}
        onClose={handleCloseAddWord}
        pairId={activePair.id}
        fromCode={activePair.sourceCode}
        toCode={activePair.targetCode}
      />

      {/* Edit word dialog — WordFormDialog retained for editing existing words */}
      <WordFormDialog
        open={formOpen}
        word={wordToEdit}
        quickAddMode={false}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />

      {/* Starter pack browser — same dialog as old WordListScreen */}
      {activePair && (
        <PackBrowserDialog
          open={packBrowserOpen}
          pairId={activePair.id}
          pairSourceCode={activePair.sourceCode}
          pairTargetCode={activePair.targetCode}
          onClose={handleClosePacks}
          onInstalled={handlePackInstalled}
        />
      )}
    </PaperSurface>
  )
}
