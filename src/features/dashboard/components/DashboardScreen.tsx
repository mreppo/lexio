/**
 * DashboardScreen — Liquid Glass Home (Today) screen.
 *
 * Layout (top to bottom):
 *   1. NavBar large "Today" — avatar placeholder, flame streak icon
 *   2. Hero glass card — due count, progress bar, start review CTA
 *   3. Quick stats row — library, mastered, accuracy
 *   4. SectionHeader "Word of the day"
 *   5. Word of the Day card — LangPair, TTS speaker, word, meaning, example
 *   6. 140px bottom spacer
 *   7. TabBar active=home
 *
 * Wrapped in <PaperSurface> so the wallpaper gradient is always the backdrop.
 * Screen scrolls; TabBar is position:fixed (see TabBar.tsx for deferral note).
 */

import { useMemo } from 'react'
import { Box, Skeleton } from '@mui/material'
import { Flame } from 'lucide-react'
import type { LanguagePair, UserSettings, DailyStats, Word, WordProgress } from '@/types'
import { PaperSurface } from '@/components/primitives'
import { NavBar } from '@/components/composites'
import { Glass } from '@/components/primitives'
import { Btn } from '@/components/atoms/Btn'
import { BigWord } from '@/components/atoms/BigWord'
import { Chip } from '@/components/atoms/Chip'
import { Progress } from '@/components/atoms/Progress'
import { LangPair } from '@/components/atoms/LangPair'
import { GlassIcon } from '@/components/atoms/GlassIcon'
import { IconGlyph } from '@/components/atoms/IconGlyph'
import { SectionHeader } from '@/components/composites/SectionHeader'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import { useTheme } from '@mui/material/styles'
import { useWordOfTheDay } from '../hooks/useWordOfTheDay'
import { speak } from '@/utils/tts'
import { MASTERED_THRESHOLD } from '@/features/words/buckets'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Approx. minutes per word for the "≈ Nmin" subtext estimate. */
const MINUTES_PER_WORD = 0.5

/** Bottom spacer height in px, per design spec. */
const BOTTOM_SPACER_PX = 140

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DashboardScreenProps {
  /** The currently active language pair (null if none selected). */
  readonly activePair: LanguagePair | null
  /** The current user settings. */
  readonly settings: UserSettings
  /** Today's daily stats (null if no session today). */
  readonly todayStats: DailyStats | null
  /** Progress records for all words in the active pair. */
  readonly wordProgressList: readonly WordProgress[]
  /** All words in the active pair (needed for Word of the Day). */
  readonly words: readonly Word[]
  /** Total words in the active pair. */
  readonly totalWords: number
  /** Current streak in days. */
  readonly streakDays: number
  /** Whether data is still loading. */
  readonly loading: boolean
  /** Called when the user taps "Start review". Navigates to quiz tab. */
  readonly onStartQuiz: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute how many words are due right now (nextReview <= Date.now()).
 * Words with no progress record are also due (never reviewed).
 */
function computeDueCount(words: readonly Word[], progressList: readonly WordProgress[]): number {
  const now = Date.now()
  const progressMap = new Map<string, WordProgress>()
  for (const p of progressList) {
    progressMap.set(p.wordId, p)
  }
  let count = 0
  for (const word of words) {
    const progress = progressMap.get(word.id)
    if (progress === undefined || progress.nextReview <= now) {
      count++
    }
  }
  return count
}

/** Count mastered words (confidence >= MASTERED_THRESHOLD). */
function computeMasteredCount(progressList: readonly WordProgress[]): number {
  return progressList.filter((p) => p.confidence >= MASTERED_THRESHOLD).length
}

/** Overall accuracy as a percentage (0–100), or null when no data. */
function computeAccuracy(todayStats: DailyStats | null): number | null {
  if (todayStats === null || todayStats.wordsReviewed === 0) return null
  return Math.round((todayStats.correctCount / todayStats.wordsReviewed) * 100)
}

// ─── Avatar placeholder ───────────────────────────────────────────────────────

interface AvatarProps {
  readonly displayName: string | null | undefined
  readonly gradientCss: string
}

function Avatar({ displayName, gradientCss }: AvatarProps): React.JSX.Element {
  // First initial — fallback "L" for Lexio when displayName is absent
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'L'

  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: gradientCss,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Box
        component="span"
        sx={{
          fontFamily: glassTypography.body,
          fontSize: 15,
          fontWeight: 700,
          color: '#ffffff',
          lineHeight: 1,
        }}
      >
        {initial}
      </Box>
    </Box>
  )
}

// ─── Streak trailing icon ─────────────────────────────────────────────────────

interface StreakIconProps {
  readonly streakDays: number
  readonly warnColor: string
}

function StreakIcon({ streakDays, warnColor }: StreakIconProps): React.JSX.Element {
  return (
    <GlassIcon as="div" aria-label={`${streakDays} day streak`} size={44}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <Flame size={18} color={warnColor} strokeWidth={2} aria-hidden />
        <Box
          component="span"
          sx={{
            fontFamily: glassTypography.body,
            fontSize: 10,
            fontWeight: 700,
            color: warnColor,
            lineHeight: 1,
          }}
        >
          {streakDays}
        </Box>
      </Box>
    </GlassIcon>
  )
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

interface HeroCardProps {
  readonly activePair: LanguagePair | null
  readonly dueCount: number
  readonly wordsReviewedToday: number
  readonly dailyGoal: number
  readonly loading: boolean
  readonly onStartQuiz: () => void
}

function HeroCard({
  activePair,
  dueCount,
  wordsReviewedToday,
  dailyGoal,
  loading,
  onStartQuiz,
}: HeroCardProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const progressValue = dailyGoal > 0 ? Math.min(1, wordsReviewedToday / dailyGoal) : 0
  const estimatedMinutes = Math.round(dueCount * MINUTES_PER_WORD)
  const noPair = activePair === null
  const allCaughtUp = !noPair && dueCount === 0

  return (
    <Box sx={{ px: '16px' }}>
      <Glass pad={22} floating strong>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton width={80} height={24} />
            <Skeleton width={140} height={72} />
            <Skeleton width={200} height={18} />
            <Skeleton width="100%" height={8} sx={{ borderRadius: 99 }} />
            <Skeleton width="100%" height={50} sx={{ borderRadius: 25 }} />
          </Box>
        ) : noPair ? (
          // Empty state: no active pair
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Chip tone="accent">DUE TODAY</Chip>
            <BigWord size={38} color={tokens.color.inkSoft}>
              Pick a language pair to start
            </BigWord>
            <Btn kind="filled" size="md" full disabled>
              Start review
            </Btn>
          </Box>
        ) : allCaughtUp ? (
          // Empty state: nothing due
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Chip tone="accent">TODAY</Chip>
            <BigWord size={52} color={tokens.color.ok}>
              All caught up!
            </BigWord>
            <Box
              component="p"
              sx={{
                margin: 0,
                fontFamily: glassTypography.body,
                fontSize: 15,
                fontWeight: 500,
                color: tokens.color.inkSec,
                lineHeight: 1.5,
              }}
            >
              No words due right now. Come back later or add more words.
            </Box>
            <Progress
              value={progressValue}
              tone="accent"
              height={8}
              aria-label="Daily goal progress"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '2px' }}>
              <Box
                component="span"
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.color.inkSec,
                }}
              >
                {wordsReviewedToday} of {dailyGoal} done
              </Box>
              <Box
                component="span"
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.color.inkSec,
                }}
              >
                Goal &middot; {dailyGoal}
              </Box>
            </Box>
          </Box>
        ) : (
          // Normal state: words due
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Chip tone="accent">DUE TODAY</Chip>

            {/* Due count + "words" */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <BigWord size={72}>{dueCount}</BigWord>
              <Box
                component="span"
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: 17,
                  fontWeight: 600,
                  color: tokens.color.inkSoft,
                  lineHeight: 1,
                }}
              >
                words
              </Box>
            </Box>

            {/* Subtext: est. time + language direction */}
            <Box
              component="p"
              sx={{
                margin: 0,
                fontFamily: glassTypography.body,
                fontSize: 14,
                fontWeight: 500,
                color: tokens.color.inkSec,
                lineHeight: 1.3,
              }}
            >
              ≈ {estimatedMinutes} min &middot; {activePair.sourceLang} &rarr;{' '}
              {activePair.targetLang}
            </Box>

            {/* Progress bar */}
            <Box sx={{ mt: '18px' }}>
              <Progress
                value={progressValue}
                tone="accent"
                height={8}
                aria-label="Daily goal progress"
              />
            </Box>

            {/* X of N done · Goal · N */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box
                component="span"
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.color.inkSec,
                }}
              >
                {wordsReviewedToday} of {dueCount} done
              </Box>
              <Box
                component="span"
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.color.inkSec,
                }}
              >
                Goal &middot; {dailyGoal}
              </Box>
            </Box>

            {/* CTA */}
            <Box sx={{ mt: '16px' }}>
              <Btn kind="filled" size="md" full onClick={onStartQuiz}>
                Start review
              </Btn>
            </Box>
          </Box>
        )}
      </Glass>
    </Box>
  )
}

// ─── Quick Stats Row ──────────────────────────────────────────────────────────

interface QuickStatCardProps {
  readonly value: string | number
  readonly label: string
}

function QuickStatCard({ value, label }: QuickStatCardProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Glass pad={14} floating sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <BigWord size={24} weight={700}>
          {value}
        </BigWord>
        <Box
          component="span"
          sx={{
            fontFamily: glassTypography.body,
            fontSize: 12,
            fontWeight: 600,
            color: tokens.color.inkSec,
            lineHeight: 1,
          }}
        >
          {label}
        </Box>
      </Box>
    </Glass>
  )
}

interface QuickStatsRowProps {
  readonly totalWords: number
  readonly masteredCount: number
  readonly accuracy: number | null
  readonly loading: boolean
}

function QuickStatsRow({
  totalWords,
  masteredCount,
  accuracy,
  loading,
}: QuickStatsRowProps): React.JSX.Element {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: '10px', px: '16px' }}>
        <Skeleton variant="rounded" width="33%" height={72} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" width="33%" height={72} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" width="33%" height={72} sx={{ borderRadius: 2 }} />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', gap: '10px', px: '16px' }} role="region" aria-label="Quick stats">
      <QuickStatCard value={totalWords} label="Library" />
      <QuickStatCard value={masteredCount} label="Mastered" />
      <QuickStatCard value={accuracy !== null ? `${accuracy}%` : '—'} label="Accuracy" />
    </Box>
  )
}

// ─── Word of the Day Card ─────────────────────────────────────────────────────

interface WordOfTheDayCardProps {
  readonly word: Word | null
  readonly activePair: LanguagePair | null
  readonly loading: boolean
}

function WordOfTheDayCard({ word, activePair, loading }: WordOfTheDayCardProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const handleSpeak = (): void => {
    if (word === null || activePair === null) return
    // The source word is in the pair's source language
    speak(word.source, activePair.sourceCode)
  }

  if (loading) {
    return (
      <Box sx={{ px: '16px' }}>
        <Glass pad={18} floating>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton width={80} height={16} />
            <Skeleton width={160} height={38} />
            <Skeleton width={220} height={18} />
            <Skeleton width="100%" height={60} sx={{ borderRadius: 2 }} />
          </Box>
        </Glass>
      </Box>
    )
  }

  if (word === null || activePair === null) {
    return (
      <Box sx={{ px: '16px' }}>
        <Glass pad={18} floating>
          <Box
            component="p"
            sx={{
              margin: 0,
              fontFamily: glassTypography.body,
              fontSize: 15,
              fontWeight: 500,
              color: tokens.color.inkSec,
            }}
          >
            Add words and start learning to see a word of the day.
          </Box>
        </Glass>
      </Box>
    )
  }

  // The target is the translation/meaning shown below the word.
  // Notes (if present) are shown in the italic example block below meaning.
  const meaning = word.target

  // Example sentence from notes — only shown when notes are present
  const hasExample = word.notes !== null && word.notes.trim().length > 0

  return (
    <Box sx={{ px: '16px' }}>
      <Glass pad={18} floating>
        {/* Header row: LangPair + speaker icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <LangPair
            from={activePair.sourceCode.toUpperCase()}
            to={activePair.targetCode.toUpperCase()}
          />
          <GlassIcon as="button" aria-label="Play pronunciation" onClick={handleSpeak} size={36}>
            <IconGlyph name="speaker" size={16} color={tokens.color.accent} decorative />
          </GlassIcon>
        </Box>

        {/* The word */}
        <Box sx={{ mt: '12px' }}>
          <BigWord size={38} weight={800}>
            {word.source}
          </BigWord>
        </Box>

        {/* Part of speech / meaning */}
        <Box
          component="p"
          sx={{
            margin: '6px 0 0',
            fontFamily: glassTypography.body,
            fontSize: 15,
            fontWeight: 500,
            color: tokens.color.inkSoft,
            lineHeight: 1.5,
          }}
        >
          {meaning}
        </Box>

        {/* Example block (italic tinted inline card) — only when notes are present */}
        {hasExample && (
          <Box
            sx={{
              mt: '12px',
              borderRadius: '14px',
              padding: '12px 14px',
              backgroundColor: tokens.glass.bg,
              border: `0.5px solid ${tokens.glass.border}`,
              // Reduce Transparency fallback
              '@media (prefers-reduced-transparency: reduce)': {
                backgroundColor: tokens.color.bg,
                border: `0.5px solid ${tokens.color.rule2}`,
              },
            }}
          >
            <Box
              component="p"
              sx={{
                margin: 0,
                fontFamily: glassTypography.body,
                fontSize: 14,
                fontWeight: 500,
                fontStyle: 'italic',
                color: tokens.color.inkSec,
                lineHeight: 1.5,
              }}
            >
              {word.notes}
            </Box>
          </Box>
        )}
      </Glass>
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardScreen({
  activePair,
  settings,
  todayStats,
  wordProgressList,
  words,
  totalWords,
  streakDays,
  loading,
  onStartQuiz,
}: DashboardScreenProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  // Stable date key for WotD (YYYY-MM-DD, recomputed only at render time)
  const dateKey = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const dueCount = useMemo(
    () => computeDueCount(words, wordProgressList),
    [words, wordProgressList],
  )

  const masteredCount = useMemo(() => computeMasteredCount(wordProgressList), [wordProgressList])

  const accuracy = useMemo(() => computeAccuracy(todayStats), [todayStats])

  const { word: wotdWord } = useWordOfTheDay(
    dateKey,
    activePair?.id ?? null,
    words,
    wordProgressList,
  )

  const wordsReviewedToday = todayStats?.wordsReviewed ?? 0

  return (
    <PaperSurface
      sx={{
        // Allow the screen to scroll; TabBar floats above via position:fixed
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <Box
        role="main"
        aria-label="Dashboard"
        sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        {/* NavBar — large mode with avatar + streak */}
        <NavBar
          large
          prominentTitle="Today"
          leading={
            <Avatar displayName={settings.displayName} gradientCss={tokens.color.avatarGradient} />
          }
          trailing={
            streakDays >= 1 ? (
              <StreakIcon streakDays={streakDays} warnColor={tokens.color.warn} />
            ) : undefined
          }
        />

        {/* Hero glass card */}
        <HeroCard
          activePair={activePair}
          dueCount={dueCount}
          wordsReviewedToday={wordsReviewedToday}
          dailyGoal={settings.dailyGoal}
          loading={loading}
          onStartQuiz={onStartQuiz}
        />

        {/* Quick stats row */}
        <Box sx={{ mt: '10px' }}>
          <QuickStatsRow
            totalWords={totalWords}
            masteredCount={masteredCount}
            accuracy={accuracy}
            loading={loading}
          />
        </Box>

        {/* Word of the Day section */}
        <SectionHeader>Word of the day</SectionHeader>
        <WordOfTheDayCard word={wotdWord} activePair={activePair} loading={loading} />

        {/* Bottom spacer — clears the fixed TabBar */}
        <Box sx={{ height: `${BOTTOM_SPACER_PX}px`, flexShrink: 0 }} aria-hidden="true" />
      </Box>
    </PaperSurface>
  )
}
