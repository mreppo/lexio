/**
 * DashboardScreen - the main home/landing screen shown after onboarding.
 *
 * Sections:
 *   1. Hero    - greeting, current streak, daily goal progress ring
 *   2. Quick start - "Start Quiz" button with active pair & mode info
 *   3. Today's summary - words reviewed today, accuracy, new words
 *   4. Word overview - Learning / Familiar / Mastered chip counts
 *   5. Recent activity - last few sessions (daily stats)
 */

import { useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Skeleton,
  Typography,
} from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import type { LanguagePair, UserSettings, DailyStats, WordProgress } from '@/types'
import { getCurrentGreeting } from '../utils/greeting'

// ─── Constants ────────────────────────────────────────────────────────────────

const RING_SIZE = 96

/** Confidence threshold for "Familiar" (between learning and mastered). */
const FAMILIAR_THRESHOLD = 0.5

/** Confidence threshold for "Mastered". */
const MASTERED_THRESHOLD = 0.8

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
  /** Total words in the active pair. */
  readonly totalWords: number
  /** Current streak in days. */
  readonly streakDays: number
  /** Recent daily stats (last 7 days), newest first. */
  readonly recentStats: readonly DailyStats[]
  /** Whether data is still loading. */
  readonly loading: boolean
  /** Called when the user taps "Start Quiz". */
  readonly onStartQuiz: () => void
}

// ─── Helper to bucket words by confidence ─────────────────────────────────────

interface WordBuckets {
  readonly learning: number
  readonly familiar: number
  readonly mastered: number
}

function bucketWords(progressList: readonly WordProgress[], totalWords: number): WordBuckets {
  let familiar = 0
  let mastered = 0
  const withProgress = new Set(progressList.map((p) => p.wordId))

  for (const p of progressList) {
    if (p.confidence >= MASTERED_THRESHOLD) {
      mastered++
    } else if (p.confidence >= FAMILIAR_THRESHOLD) {
      familiar++
    }
  }

  // Words with no progress record are implicitly "learning".
  const learning = totalWords - withProgress.size + (progressList.length - familiar - mastered)

  return { learning, familiar, mastered }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface HeroSectionProps {
  readonly greeting: string
  readonly streakDays: number
  readonly wordsReviewedToday: number
  readonly dailyGoal: number
  readonly loading: boolean
}

function HeroSection({
  greeting,
  streakDays,
  wordsReviewedToday,
  dailyGoal,
  loading,
}: HeroSectionProps) {
  const goalMet = wordsReviewedToday >= dailyGoal
  const progressValue = dailyGoal > 0 ? Math.min(100, (wordsReviewedToday / dailyGoal) * 100) : 0

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        p: 3,
        borderRadius: 3,
        bgcolor: goalMet ? 'success.main' : 'background.paper',
        border: 1,
        borderColor: goalMet ? 'success.main' : 'divider',
        transition: 'background-color 0.3s, border-color 0.3s',
      }}
      role="region"
      aria-label="Daily goal progress"
    >
      {/* Circular progress ring */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={RING_SIZE}
          thickness={4}
          sx={{
            color: goalMet ? 'rgba(255,255,255,0.3)' : 'action.hover',
            position: 'absolute',
          }}
          aria-hidden="true"
        />
        <CircularProgress
          variant="determinate"
          value={progressValue}
          size={RING_SIZE}
          thickness={4}
          sx={{ color: goalMet ? 'white' : 'primary.main' }}
          aria-label={`Daily goal: ${wordsReviewedToday} of ${dailyGoal} words reviewed today`}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          {goalMet ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 32, color: 'white' }} />
          ) : (
            <>
              <Typography
                variant="caption"
                fontWeight={700}
                lineHeight={1}
                sx={{ color: 'text.primary', fontSize: '0.9rem' }}
              >
                {wordsReviewedToday}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', fontSize: '0.65rem', lineHeight: 1 }}
              >
                / {dailyGoal}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Right side */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <>
            <Skeleton width={120} height={20} />
            <Skeleton width={80} height={16} sx={{ mt: 0.5 }} />
          </>
        ) : (
          <>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: goalMet ? 'white' : 'text.primary' }}
            >
              {greeting}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: goalMet ? 'rgba(255,255,255,0.85)' : 'text.secondary',
                display: 'block',
              }}
            >
              {goalMet
                ? `${wordsReviewedToday} words today — goal met!`
                : `${wordsReviewedToday} / ${dailyGoal} words today`}
            </Typography>

            {streakDays >= 1 && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  mt: 0.5,
                  color: goalMet ? 'rgba(255,255,255,0.9)' : 'warning.main',
                }}
                role="status"
                aria-label={`${streakDays} day streak`}
              >
                <LocalFireDepartmentIcon sx={{ fontSize: 14 }} aria-hidden="true" />
                <Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1 }}>
                  {streakDays} day{streakDays !== 1 ? 's' : ''} streak
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}

// ─── Quick Start section ──────────────────────────────────────────────────────

interface QuickStartProps {
  readonly activePair: LanguagePair | null
  readonly quizMode: string
  readonly onStartQuiz: () => void
  readonly loading: boolean
}

function QuickStart({ activePair, quizMode, onStartQuiz, loading }: QuickStartProps) {
  const modeLabel = quizMode.charAt(0).toUpperCase() + quizMode.slice(1)

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Quick start
            </Typography>
            {loading ? (
              <Skeleton width={100} height={16} />
            ) : (
              <Typography variant="caption" color="text.secondary">
                {activePair
                  ? `${activePair.sourceLang} → ${activePair.targetLang} · ${modeLabel} mode`
                  : 'No language pair selected'}
              </Typography>
            )}
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<PlayArrowIcon />}
          onClick={onStartQuiz}
          disabled={activePair === null || loading}
          aria-label="Start quiz"
        >
          Start Quiz
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Today's summary ──────────────────────────────────────────────────────────

interface TodaysSummaryProps {
  readonly todayStats: DailyStats | null
  readonly dailyGoal: number
  readonly loading: boolean
}

function TodaysSummary({ todayStats, loading }: TodaysSummaryProps) {
  const wordsReviewed = todayStats?.wordsReviewed ?? 0
  const correctCount = todayStats?.correctCount ?? 0
  const accuracy = wordsReviewed > 0 ? Math.round((correctCount / wordsReviewed) * 100) : null

  const statItems = [
    {
      label: 'Reviewed',
      value: wordsReviewed,
      suffix: 'words',
    },
    {
      label: 'Accuracy',
      value: accuracy !== null ? `${accuracy}%` : '—',
      suffix: '',
    },
  ]

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Today
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Skeleton width={60} height={40} />
            <Skeleton width={60} height={40} />
          </Box>
        ) : todayStats === null ? (
          <Typography variant="body2" color="text.secondary">
            No sessions yet today. Start a quiz to begin!
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 3 }}>
            {statItems.map(({ label, value, suffix }) => (
              <Box key={label}>
                <Typography variant="h5" fontWeight={700} lineHeight={1}>
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {label}
                  {suffix ? ` ${suffix}` : ''}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Word overview ────────────────────────────────────────────────────────────

interface WordOverviewProps {
  readonly buckets: WordBuckets
  readonly totalWords: number
  readonly loading: boolean
}

function WordOverview({ buckets, totalWords, loading }: WordOverviewProps) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Word overview
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton width={80} height={32} sx={{ borderRadius: 4 }} />
            <Skeleton width={80} height={32} sx={{ borderRadius: 4 }} />
            <Skeleton width={80} height={32} sx={{ borderRadius: 4 }} />
          </Box>
        ) : totalWords === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No words added yet. Add words to get started!
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${buckets.learning} learning`}
              size="small"
              sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}
              aria-label={`${buckets.learning} words in learning stage`}
            />
            <Chip
              label={`${buckets.familiar} familiar`}
              size="small"
              sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}
              aria-label={`${buckets.familiar} familiar words`}
            />
            <Chip
              label={`${buckets.mastered} mastered`}
              size="small"
              sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}
              aria-label={`${buckets.mastered} mastered words`}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Recent activity ──────────────────────────────────────────────────────────

interface RecentActivityProps {
  readonly recentStats: readonly DailyStats[]
  readonly loading: boolean
}

function RecentActivity({ recentStats, loading }: RecentActivityProps) {
  // Show at most 5 recent days that have any activity.
  const activeDays = recentStats.filter((s) => s.wordsReviewed > 0).slice(0, 5)

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Recent activity
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton width="100%" height={24} />
            <Skeleton width="80%" height={24} />
          </Box>
        ) : activeDays.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No recent activity. Complete a quiz to build your streak!
          </Typography>
        ) : (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
            role="list"
            aria-label="Recent activity"
          >
            {activeDays.map((day) => {
              const accuracy =
                day.wordsReviewed > 0 ? Math.round((day.correctCount / day.wordsReviewed) * 100) : 0
              return (
                <Box
                  key={day.date}
                  role="listitem"
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {day.date}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2">{day.wordsReviewed} words</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {accuracy}% correct
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardScreen({
  activePair,
  settings,
  todayStats,
  wordProgressList,
  totalWords,
  streakDays,
  recentStats,
  loading,
  onStartQuiz,
}: DashboardScreenProps) {
  const greeting = useMemo(() => getCurrentGreeting(), [])
  const buckets = useMemo(
    () => bucketWords(wordProgressList, totalWords),
    [wordProgressList, totalWords],
  )

  const wordsReviewedToday = todayStats?.wordsReviewed ?? 0

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      role="main"
      aria-label="Dashboard"
    >
      <HeroSection
        greeting={greeting}
        streakDays={streakDays}
        wordsReviewedToday={wordsReviewedToday}
        dailyGoal={settings.dailyGoal}
        loading={loading}
      />

      <QuickStart
        activePair={activePair}
        quizMode={settings.quizMode}
        onStartQuiz={onStartQuiz}
        loading={loading}
      />

      <TodaysSummary todayStats={todayStats} dailyGoal={settings.dailyGoal} loading={loading} />

      <WordOverview buckets={buckets} totalWords={totalWords} loading={loading} />

      <RecentActivity recentStats={recentStats} loading={loading} />
    </Box>
  )
}
