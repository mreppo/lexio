/**
 * DashboardScreen - the main home/landing screen shown after onboarding.
 *
 * Layout (top to bottom):
 *   1. Hero Area    - gradient background, progress ring, greeting, streak badge
 *   2. Start Quiz CTA - full-width amber button, visually dominant
 *   3. Today's Stats  - two-column layout using tonal surfaces (no bordered cards)
 *   4. Mastery Progress - segmented horizontal bar (Learning/Familiar/Mastered)
 *   5. Recent Activity  - compact list of last 3-5 active days
 *
 * Visual principles (from docs/design/DESIGN.md):
 * - No bordered cards - sections separated by tonal background shifts only
 * - Sora for headings/display numbers, Nunito for body/labels
 * - Amber gradient hero area (Coach's Hub style)
 * - All animations respect `prefers-reduced-motion`
 */

import { useMemo } from 'react'
import { Box, Button, CircularProgress, Skeleton, Typography } from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import type { LanguagePair, UserSettings, DailyStats, WordProgress } from '@/types'
import { getCurrentGreeting } from '../utils/greeting'
import { useCountUp } from '@/hooks/useCountUp'
import { GLOW_KEYFRAMES, COUNT_UP_MS, REDUCED_MOTION_ANIMATION_NONE } from '@/utils/animation'

// ─── Constants ────────────────────────────────────────────────────────────────

const RING_SIZE = 112

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

// ─── Hero Section ─────────────────────────────────────────────────────────────

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
    <>
      <style>{GLOW_KEYFRAMES}</style>

      {/* Amber-to-dark gradient hero - no border, fills edge to edge */}
      <Box
        sx={{
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(160deg, #92400e 0%, #78350f 30%, #1c1917 70%, #0a0f1a 100%)'
              : 'linear-gradient(160deg, #fef3c7 0%, #fde68a 25%, #fbbf24 60%, #f59e0b 100%)',
          borderRadius: 3,
          px: 3,
          pt: 4,
          pb: 3.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
        role="region"
        aria-label="Daily goal progress"
      >
        {/* Progress ring - prominently centered */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          {/* Track ring */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={RING_SIZE}
            thickness={4}
            sx={{
              color: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              position: 'absolute',
            }}
            aria-hidden="true"
          />
          {/* Progress arc */}
          <CircularProgress
            variant="determinate"
            value={progressValue}
            size={RING_SIZE}
            thickness={4}
            sx={{
              color: goalMet ? 'success.light' : 'primary.main',
              '& .MuiCircularProgress-circle': {
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',
                },
              },
            }}
            aria-label={`Daily goal: ${wordsReviewedToday} of ${dailyGoal} words reviewed today`}
          />
          {/* Ring centre label */}
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
              <CheckCircleOutlineIcon
                sx={{
                  fontSize: 36,
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? 'success.light' : 'success.dark',
                }}
              />
            ) : (
              <>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  lineHeight={1}
                  sx={{
                    color: (theme) => (theme.palette.mode === 'dark' ? 'primary.light' : '#78350f'),
                    fontFamily: '"Sora", sans-serif',
                  }}
                >
                  {wordsReviewedToday}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.5)'
                        : 'rgba(120,53,15,0.7)',
                    fontSize: '0.65rem',
                    lineHeight: 1,
                  }}
                >
                  / {dailyGoal}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {/* Greeting text */}
        {loading ? (
          <Skeleton width={140} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
        ) : (
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: (theme) => (theme.palette.mode === 'dark' ? '#fef3c7' : '#78350f'),
              fontFamily: '"Sora", sans-serif',
              textAlign: 'center',
            }}
          >
            {greeting}
          </Typography>
        )}

        {/* Streak badge */}
        {!loading && streakDays >= 1 && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              borderRadius: 99,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(245,158,11,0.2)' : 'rgba(120,53,15,0.15)',
              color: (theme) => (theme.palette.mode === 'dark' ? 'primary.light' : '#78350f'),
              animation: streakDays >= 3 ? 'lexio-glow 2s ease-in-out infinite' : undefined,
              ...REDUCED_MOTION_ANIMATION_NONE,
            }}
            role="status"
            aria-label={`${streakDays} day streak`}
          >
            <LocalFireDepartmentIcon sx={{ fontSize: 16 }} aria-hidden="true" />
            <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1 }}>
              {streakDays} day{streakDays !== 1 ? 's' : ''} streak
            </Typography>
          </Box>
        )}
      </Box>
    </>
  )
}

// ─── Start Quiz CTA ───────────────────────────────────────────────────────────

interface StartQuizCtaProps {
  readonly activePair: LanguagePair | null
  readonly quizMode: string
  readonly onStartQuiz: () => void
  readonly loading: boolean
}

function StartQuizCta({ activePair, quizMode, onStartQuiz, loading }: StartQuizCtaProps) {
  const modeLabel = quizMode.charAt(0).toUpperCase() + quizMode.slice(1)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {loading ? (
        <Skeleton width={140} height={16} />
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {activePair
            ? `${activePair.sourceLang} \u2192 ${activePair.targetLang} \u00b7 ${modeLabel} mode`
            : 'No language pair selected'}
        </Typography>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<PlayArrowIcon />}
        onClick={onStartQuiz}
        disabled={activePair === null || loading}
        aria-label="Start quiz"
        sx={{
          py: 1.75,
          fontSize: '1.05rem',
          letterSpacing: '0.05em',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            bgcolor: 'primary.dark',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(245,158,11,0.35)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:hover': { transform: 'none' },
            '&:active': { transform: 'none' },
          },
        }}
      >
        START QUIZ
      </Button>
    </Box>
  )
}

// ─── Today's Stats ────────────────────────────────────────────────────────────

interface TodayStatsProps {
  readonly todayStats: DailyStats | null
  readonly loading: boolean
}

interface AnimatedStatProps {
  readonly value: number
  readonly label: string
  readonly suffix?: string
  readonly enabled: boolean
}

function AnimatedStat({ value, label, suffix = '', enabled }: AnimatedStatProps) {
  const displayValue = useCountUp(value, COUNT_UP_MS, enabled)

  return (
    <Box sx={{ flex: 1, textAlign: 'center' }}>
      <Typography
        variant="h4"
        fontWeight={700}
        lineHeight={1}
        sx={{ fontFamily: '"Sora", sans-serif' }}
      >
        {displayValue}
        {suffix}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
        {label}
      </Typography>
    </Box>
  )
}

function TodayStats({ todayStats, loading }: TodayStatsProps) {
  const wordsReviewed = todayStats?.wordsReviewed ?? 0
  const correctCount = todayStats?.correctCount ?? 0
  const accuracy = wordsReviewed > 0 ? Math.round((correctCount / wordsReviewed) * 100) : null

  // Only animate when data is freshly loaded (not during loading).
  const animateStats = !loading && todayStats !== null

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Today
      </Typography>

      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          borderRadius: 3,
          p: 2.5,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Skeleton width={80} height={48} />
            <Skeleton width={80} height={48} />
          </Box>
        ) : todayStats === null ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AutoStoriesIcon sx={{ color: 'text.disabled', fontSize: 28 }} aria-hidden="true" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                No sessions yet today
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Start a quiz to begin your streak!
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <AnimatedStat value={wordsReviewed} label="words reviewed" enabled={animateStats} />
            {accuracy !== null && (
              <AnimatedStat value={accuracy} label="accuracy" suffix="%" enabled={animateStats} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ─── Mastery Progress (segmented bar) ─────────────────────────────────────────

interface MasteryProgressProps {
  readonly buckets: WordBuckets
  readonly totalWords: number
  readonly loading: boolean
}

function MasteryProgress({ buckets, totalWords, loading }: MasteryProgressProps) {
  const learningPct = totalWords > 0 ? (buckets.learning / totalWords) * 100 : 0
  const familiarPct = totalWords > 0 ? (buckets.familiar / totalWords) * 100 : 0
  const masteredPct = totalWords > 0 ? (buckets.mastered / totalWords) * 100 : 0

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Mastery Progress
      </Typography>

      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          borderRadius: 3,
          p: 2.5,
        }}
      >
        {loading ? (
          <Skeleton width="100%" height={16} sx={{ borderRadius: 2 }} />
        ) : totalWords === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EmojiEventsIcon sx={{ color: 'text.disabled', fontSize: 28 }} aria-hidden="true" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                No words added yet
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Add words to your list to start learning!
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {/* Segmented bar */}
            <Box
              sx={{
                display: 'flex',
                height: 12,
                borderRadius: 99,
                overflow: 'hidden',
                gap: '2px',
              }}
              role="img"
              aria-label={`Mastery distribution: ${buckets.learning} learning, ${buckets.familiar} familiar, ${buckets.mastered} mastered`}
            >
              {learningPct > 0 && (
                <Box
                  sx={{
                    flex: learningPct,
                    bgcolor: 'warning.main',
                    borderRadius: familiarPct === 0 && masteredPct === 0 ? 99 : '99px 0 0 99px',
                  }}
                  aria-hidden="true"
                />
              )}
              {familiarPct > 0 && (
                <Box
                  sx={{
                    flex: familiarPct,
                    bgcolor: 'secondary.main',
                    borderRadius:
                      learningPct === 0 && masteredPct === 0
                        ? 99
                        : learningPct === 0
                          ? '99px 0 0 99px'
                          : masteredPct === 0
                            ? '0 99px 99px 0'
                            : 0,
                  }}
                  aria-hidden="true"
                />
              )}
              {masteredPct > 0 && (
                <Box
                  sx={{
                    flex: masteredPct,
                    bgcolor: 'success.main',
                    borderRadius: learningPct === 0 && familiarPct === 0 ? 99 : '0 99px 99px 0',
                  }}
                  aria-hidden="true"
                />
              )}
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }}
                  aria-hidden="true"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  aria-label={`${buckets.learning} words in learning stage`}
                >
                  Learning ({buckets.learning})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }}
                  aria-hidden="true"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  aria-label={`${buckets.familiar} familiar words`}
                >
                  Familiar ({buckets.familiar})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }}
                  aria-hidden="true"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  aria-label={`${buckets.mastered} mastered words`}
                >
                  Mastered ({buckets.mastered})
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

interface RecentActivityProps {
  readonly recentStats: readonly DailyStats[]
  readonly loading: boolean
}

function RecentActivity({ recentStats, loading }: RecentActivityProps) {
  // Show at most 5 recent days that have any activity.
  const activeDays = recentStats.filter((s) => s.wordsReviewed > 0).slice(0, 5)

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Recent Activity
      </Typography>

      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          borderRadius: 3,
          p: 2.5,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton width="100%" height={24} />
            <Skeleton width="80%" height={24} />
          </Box>
        ) : activeDays.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocalFireDepartmentIcon
              sx={{ color: 'text.disabled', fontSize: 28 }}
              aria-hidden="true"
            />
            <Box>
              <Typography variant="body2" color="text.secondary">
                No recent activity
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Complete a quiz to build your streak!
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}
            role="list"
            aria-label="Recent activity"
          >
            {activeDays.map((day, index) => {
              const accuracy =
                day.wordsReviewed > 0 ? Math.round((day.correctCount / day.wordsReviewed) * 100) : 0
              const isLast = index === activeDays.length - 1
              return (
                <Box
                  key={day.date}
                  role="listitem"
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.25,
                    borderBottom: isLast ? 'none' : '1px solid',
                    borderColor: 'divider',
                    gap: 2,
                  }}
                >
                  {/* Left accent bar */}
                  <Box
                    sx={{
                      width: 3,
                      height: 32,
                      borderRadius: 99,
                      bgcolor: 'primary.main',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {day.date}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
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
      </Box>
    </Box>
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
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
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

      <StartQuizCta
        activePair={activePair}
        quizMode={settings.quizMode}
        onStartQuiz={onStartQuiz}
        loading={loading}
      />

      <TodayStats todayStats={todayStats} loading={loading} />

      <MasteryProgress buckets={buckets} totalWords={totalWords} loading={loading} />

      <RecentActivity recentStats={recentStats} loading={loading} />
    </Box>
  )
}
