/**
 * StatsScreen — Liquid Glass Progress screen (issue #151).
 *
 * Layout (top to bottom, inside PaperSurface):
 *   1. NavBar large prominentTitle="Progress" — trailing share GlassIcon
 *   2. Streak hero gradient tile (NOT Glass — solid gradient box)
 *   3. Two stat cards row: Accuracy (with weekly delta) + Mastered (count/total)
 *   4. SectionHeader "This week" + Glass card with bar chart
 *   5. SectionHeader "Knowledge" + Glass card with stacked horizontal bar + legend
 *   6. 140px bottom spacer
 *
 * The screen does NOT render <TabBar> — that is handled by AppContent.tsx.
 * Screen root is <PaperSurface> per the Liquid Glass Amendment.
 *
 * Data sources:
 *   - useStats hook: words, progress, dailyStats, streakDays, bestStreak
 *   - buildActivityDays: week-of-7 for the bar chart
 *   - computeBucketCounts + buildWordStatsList: Knowledge section
 *   - Week-over-week accuracy delta: derived inline from dailyStats
 *
 * Share:
 *   - Web Share API feature-detected at call site
 *   - Fallback: MUI Snackbar toast "Sharing not supported on this device"
 *
 * Zero delta display: omit the delta line entirely (show nothing) when delta is 0
 * or when there is no prior week data. This keeps the UI clean.
 *
 * Week convention: Monday-start (EU). Days shown Mon Tue Wed Thu Fri Sat Sun.
 * Today's bar uses accent colour; zero-value bars use rule2; other bars use ink.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Box, Snackbar } from '@mui/material'
import { Flame, Share2 } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { PaperSurface } from '@/components/primitives/PaperSurface'
import { NavBar } from '@/components/composites/NavBar'
import { SectionHeader } from '@/components/composites/SectionHeader'
import { Glass } from '@/components/primitives/Glass'
import { GlassIcon } from '@/components/atoms/GlassIcon'
import { BigWord } from '@/components/atoms/BigWord'
import { getGlassTokens, glassTypography, glassRadius } from '@/theme/liquidGlass'
import { useStorage } from '@/hooks/useStorage'
import { useStats } from '../hooks/useStats'
import { buildWordStatsList, computeBucketCounts } from '../utils/confidenceBuckets'
import { formatDate } from '@/services/streakService'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Bottom spacer height to clear the fixed TabBar. */
const BOTTOM_SPACER_PX = 140

/** Bar chart: maximum bar height in px. */
const BAR_SCALE_HEIGHT = 84

/** Bar chart: minimum bar height in px (even for zero values). */
const BAR_MIN_HEIGHT = 4

/** Bar chart: gap between bars in px. */
const BAR_GAP_PX = 8

/** Bar chart: border-radius for bars in px. */
const BAR_RADIUS_PX = 6

/** Streak hero padding in px per spec. */
const STREAK_HERO_PAD = 22

/** Stat cards row gap in px. */
const STAT_CARD_GAP = 10

/** Knowledge stacked bar height in px. */
const KNOWLEDGE_BAR_HEIGHT = 14

/** Knowledge stacked bar border-radius in px — outer clips inner segments. */
const KNOWLEDGE_BAR_RADIUS = 99

/** Legend dot size in px. */
const LEGEND_DOT_SIZE = 10

// ─── Day-of-week helpers (Monday-start) ──────────────────────────────────────

/**
 * The 7 single-letter day labels starting from Monday.
 * Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6.
 */
const MON_START_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

/**
 * Returns the Monday-start day index (0=Monday … 6=Sunday) for a given JS
 * Date. JS getDay() is 0=Sunday, so we remap: Sun (0) → 6, Mon (1) → 0, etc.
 */
function mondayStartDay(date: Date): number {
  const jsDay = date.getDay() // 0=Sun, 1=Mon … 6=Sat
  return (jsDay + 6) % 7 // Mon=0 … Sun=6
}

/**
 * Builds an ordered array of 7 dates (YYYY-MM-DD) representing the current
 * week starting from Monday. Index 0 = Monday, index 6 = Sunday.
 * Today may be any index.
 */
function currentWeekMondayStart(today: Date = new Date()): readonly string[] {
  const dayIdx = mondayStartDay(today) // How many days since Monday
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - dayIdx + i)
    dates.push(formatDate(d))
  }
  return dates
}

// ─── Week-over-week accuracy delta ───────────────────────────────────────────

/**
 * Computes accuracy (0-100) for a set of daily stats date keys.
 * Returns null when there are no reviews in that range.
 */
function weekAccuracy(
  statsMap: ReadonlyMap<string, { correctCount: number; wordsReviewed: number }>,
  dates: readonly string[],
): number | null {
  let totalReviewed = 0
  let totalCorrect = 0
  for (const date of dates) {
    const entry = statsMap.get(date)
    if (entry === undefined) continue
    totalReviewed += entry.wordsReviewed
    totalCorrect += entry.correctCount
  }
  if (totalReviewed === 0) return null
  return Math.round((totalCorrect / totalReviewed) * 100)
}

/**
 * Computes current-week and prior-week accuracy from daily stats.
 * Returns { current, delta } where delta is (current − prior), or null when
 * no comparison is possible.
 */
function computeAccuracyWithDelta(
  dailyStats: readonly { date: string; correctCount: number; wordsReviewed: number }[],
  today: Date = new Date(),
): { current: number | null; delta: number | null } {
  const statsMap = new Map(dailyStats.map((s) => [s.date, s]))

  const weekDates = currentWeekMondayStart(today)

  // Prior week: same 7 slots shifted 7 days back
  const priorWeekDates = weekDates.map((dateStr) => {
    const d = new Date(`${dateStr}T00:00:00`)
    d.setDate(d.getDate() - 7)
    return formatDate(d)
  })

  const current = weekAccuracy(statsMap, weekDates)
  const prior = weekAccuracy(statsMap, priorWeekDates)

  const delta = current !== null && prior !== null && current - prior !== 0 ? current - prior : null

  return { current, delta }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Streak Hero ──────────────────────────────────────────────────────────────

interface StreakHeroProps {
  readonly streakDays: number
  readonly bestStreak: number
}

function StreakHero({ streakDays, bestStreak }: StreakHeroProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)
  const typo = glassTypography.roles

  return (
    <Box
      sx={{
        mx: `${16}px`,
        borderRadius: `${glassRadius.card}px`,
        background: tokens.color.streakGradient,
        padding: `${STREAK_HERO_PAD}px`,
        // Reduce Motion: no animation per spec (gradient tile is static)
      }}
      aria-label={`${streakDays} day streak, best ${bestStreak} days`}
    >
      {/* Eyebrow row: flame + STREAK label */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          mb: '8px',
        }}
      >
        <Flame size={20} color="#ffffff" strokeWidth={2.5} aria-hidden />
        <Box
          component="span"
          sx={{
            fontFamily: glassTypography.body,
            fontSize: typo.streakEyebrow.size,
            fontWeight: typo.streakEyebrow.weight,
            letterSpacing: `${typo.streakEyebrow.tracking}px`,
            lineHeight: typo.streakEyebrow.lineHeight,
            textTransform: 'uppercase',
            color: '#ffffff',
          }}
        >
          Streak
        </Box>
      </Box>

      {/* Number row: big streak number + helper text */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <BigWord size={68} color="#ffffff">
          {streakDays}
        </BigWord>
        <Box
          component="span"
          sx={{
            fontFamily: glassTypography.body,
            fontSize: typo.streakHelper.size,
            fontWeight: typo.streakHelper.weight,
            letterSpacing: `${typo.streakHelper.tracking}px`,
            lineHeight: typo.streakHelper.lineHeight,
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          {`days · best ${bestStreak}`}
        </Box>
      </Box>
    </Box>
  )
}

// ─── Stat Cards Row ───────────────────────────────────────────────────────────

interface AccuracyCardProps {
  readonly current: number | null
  readonly delta: number | null
}

function AccuracyCard({ current, delta }: AccuracyCardProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)
  const typo = glassTypography.roles

  const displayValue = current !== null ? `${current}%` : '—'

  return (
    <Glass pad={14} floating sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Main number */}
        <BigWord size={typo.statCardNumber.size} weight={typo.statCardNumber.weight}>
          {displayValue}
        </BigWord>

        {/* Delta line — only shown when nonzero and data available */}
        {delta !== null && (
          <Box
            component="span"
            sx={{
              fontFamily: glassTypography.body,
              fontSize: typo.statCardSub.size,
              fontWeight: typo.statCardSub.weight,
              letterSpacing: `${typo.statCardSub.tracking}px`,
              lineHeight: typo.statCardSub.lineHeight,
              color: delta > 0 ? tokens.color.ok : tokens.color.red,
            }}
          >
            {delta > 0 ? `↑ ${delta}%` : `↓ ${Math.abs(delta)}%`} wk/wk
          </Box>
        )}

        {/* Static label */}
        <Box
          component="span"
          sx={{
            fontFamily: glassTypography.body,
            fontSize: typo.statCardSub.size,
            fontWeight: 600,
            letterSpacing: `${typo.statCardSub.tracking}px`,
            color: tokens.color.inkSec,
          }}
        >
          Accuracy
        </Box>
      </Box>
    </Glass>
  )
}

interface MasteredCardProps {
  readonly masteredCount: number
  readonly totalWords: number
}

function MasteredCard({ masteredCount, totalWords }: MasteredCardProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)
  const typo = glassTypography.roles

  const pct = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0
  const displayValue = `${masteredCount}/${totalWords}`

  return (
    <Glass pad={14} floating sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <BigWord size={typo.statCardNumber.size} weight={typo.statCardNumber.weight}>
          {displayValue}
        </BigWord>

        <Box
          component="span"
          sx={{
            fontFamily: glassTypography.body,
            fontSize: typo.statCardSub.size,
            fontWeight: 600,
            letterSpacing: `${typo.statCardSub.tracking}px`,
            lineHeight: typo.statCardSub.lineHeight,
            color: tokens.color.inkSec,
          }}
        >
          {`${pct}% of library`}
        </Box>

        <Box
          component="span"
          sx={{
            fontFamily: glassTypography.body,
            fontSize: typo.statCardSub.size,
            fontWeight: 600,
            letterSpacing: `${typo.statCardSub.tracking}px`,
            color: tokens.color.inkSec,
          }}
        >
          Mastered
        </Box>
      </Box>
    </Glass>
  )
}

// ─── Week Bar Chart ───────────────────────────────────────────────────────────

interface WeekBarChartProps {
  /** 7 activity days ordered Mon-Sun. */
  readonly weekDays: readonly {
    date: string
    wordsReviewed: number
  }[]
  readonly todayDate: string
}

function WeekBarChart({ weekDays, todayDate }: WeekBarChartProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)
  const typo = glassTypography.roles

  const maxReviewed = Math.max(...weekDays.map((d) => d.wordsReviewed), 1)
  const totalReviewed = weekDays.reduce((s, d) => s + d.wordsReviewed, 0)

  return (
    <Box>
      {/* Headline */}
      <Box
        component="span"
        sx={{
          display: 'block',
          fontFamily: glassTypography.body,
          fontSize: 15,
          fontWeight: 600,
          color: tokens.color.inkSoft,
          mb: '12px',
        }}
      >
        {totalReviewed} words reviewed
      </Box>

      {/* Bar chart */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: '100px',
          gap: `${BAR_GAP_PX}px`,
        }}
        role="img"
        aria-label="This week bar chart"
      >
        {weekDays.map((day, idx) => {
          const isToday = day.date === todayDate
          const isZero = day.wordsReviewed === 0
          const barHeight = isZero
            ? BAR_MIN_HEIGHT
            : Math.max((day.wordsReviewed / maxReviewed) * BAR_SCALE_HEIGHT, BAR_MIN_HEIGHT)
          const barColor = isZero
            ? tokens.color.rule2
            : isToday
              ? tokens.color.accent
              : tokens.color.ink

          const dayLetter = MON_START_LETTERS[idx] ?? 'D'
          const ariaLabel = `${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx] ?? ''}: ${day.wordsReviewed} words reviewed`

          return (
            <Box
              key={day.date}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              {/* Bar */}
              <Box
                sx={{
                  width: '100%',
                  height: `${barHeight}px`,
                  borderRadius: `${BAR_RADIUS_PX}px`,
                  backgroundColor: barColor,
                  // Transition only opacity/transform (no blur surface animation)
                  '@media (prefers-reduced-motion: no-preference)': {
                    transition: 'height 300ms ease',
                  },
                }}
                aria-label={ariaLabel}
              />
              {/* Day letter */}
              <Box
                component="span"
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: typo.barDayLabel.size,
                  fontWeight: typo.barDayLabel.weight,
                  color: isToday ? tokens.color.accent : tokens.color.inkSec,
                  mt: '4px',
                  lineHeight: typo.barDayLabel.lineHeight,
                  textAlign: 'center',
                }}
                aria-hidden
              >
                {dayLetter}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

// ─── Knowledge Section ────────────────────────────────────────────────────────

interface KnowledgeBarProps {
  readonly mastered: number
  readonly learning: number
  readonly struggling: number
}

function KnowledgeBar({ mastered, learning, struggling }: KnowledgeBarProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const total = mastered + learning + struggling
  const hasCounts = total > 0

  const ariaLabel =
    total > 0
      ? `${mastered} mastered, ${learning} learning, ${struggling} struggling`
      : 'No words yet'

  interface SegmentConfig {
    readonly count: number
    readonly color: string
    readonly label: string
    readonly key: string
  }

  const segments: readonly SegmentConfig[] = [
    { count: mastered, color: tokens.color.ok, label: 'Mastered', key: 'mastered' },
    { count: learning, color: tokens.color.warn, label: 'Learning', key: 'learning' },
    { count: struggling, color: tokens.color.red, label: 'Struggling', key: 'struggling' },
  ]

  return (
    <Box>
      {/* Stacked horizontal bar */}
      <Box
        role="img"
        aria-label={ariaLabel}
        sx={{
          display: 'flex',
          height: `${KNOWLEDGE_BAR_HEIGHT}px`,
          borderRadius: `${KNOWLEDGE_BAR_RADIUS}px`,
          overflow: 'hidden',
          backgroundColor: tokens.color.rule2,
          mb: '14px',
        }}
      >
        {hasCounts &&
          segments.map((seg) =>
            seg.count > 0 ? (
              <Box
                key={seg.key}
                sx={{
                  flex: `${seg.count} ${seg.count} 0`,
                  backgroundColor: seg.color,
                  // No border-radius on segments — outer container clips them
                }}
                aria-hidden
              />
            ) : null,
          )}
      </Box>

      {/* Legend rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {segments.map((seg, idx) => (
          <Box key={seg.key}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                py: '8px',
              }}
            >
              {/* Colored dot */}
              <Box
                aria-hidden
                sx={{
                  width: `${LEGEND_DOT_SIZE}px`,
                  height: `${LEGEND_DOT_SIZE}px`,
                  borderRadius: `${KNOWLEDGE_BAR_RADIUS}px`,
                  backgroundColor: seg.color,
                  flexShrink: 0,
                }}
              />
              {/* Label */}
              <Box
                component="span"
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: 15,
                  fontWeight: 700,
                  color: tokens.color.inkSoft,
                  flex: 1,
                }}
              >
                {seg.label}
              </Box>
              {/* Count */}
              <Box
                component="span"
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: 15,
                  fontWeight: 700,
                  color: tokens.color.inkSoft,
                }}
              >
                {seg.count}
              </Box>
            </Box>
            {/* Hairline divider — after each row except the last */}
            {idx < segments.length - 1 && (
              <Box
                aria-hidden
                sx={{
                  height: '0.5px',
                  backgroundColor: tokens.color.rule2,
                  mx: 0,
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// ─── Inner screen content ─────────────────────────────────────────────────────

interface StatsContentProps {
  readonly activePairId: string | null
}

function StatsContent({ activePairId }: StatsContentProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const { words, progress, dailyStats, streakDays, bestStreak } = useStats(activePairId)

  // Bucket counts for the Knowledge section
  const wordStats = useMemo(() => buildWordStatsList(words, progress), [words, progress])
  const buckets = useMemo(() => computeBucketCounts(wordStats), [wordStats])

  // Accuracy + weekly delta
  const { current: accuracyCurrent, delta: accuracyDelta } = useMemo(
    () => computeAccuracyWithDelta(dailyStats),
    [dailyStats],
  )

  // Mastered count (using the stats screen's MASTERED_THRESHOLD = 0.7)
  const masteredCount = buckets.mastered
  const totalWords = buckets.total

  // Week bar chart: 7 days Mon-start
  const today = useMemo(() => new Date(), [])
  const todayDate = useMemo(() => formatDate(today), [today])
  const weekDateStrings = useMemo(() => currentWeekMondayStart(today), [today])

  // Build ActivityDay map from dailyStats for O(1) lookup
  const statsMap = useMemo(() => new Map(dailyStats.map((s) => [s.date, s])), [dailyStats])

  // 7-day array ordered Mon-Sun with wordsReviewed
  const weekDays = useMemo(
    () =>
      weekDateStrings.map((date) => ({
        date,
        wordsReviewed: statsMap.get(date)?.wordsReviewed ?? 0,
      })),
    [weekDateStrings, statsMap],
  )

  // Toast for share fallback
  const [shareToastOpen, setShareToastOpen] = useState(false)
  const [shareToastMsg, setShareToastMsg] = useState('')

  const handleShare = useCallback((): void => {
    const payload = {
      title: 'My Lexio progress',
      text: `${streakDays} day streak, ${masteredCount}/${totalWords} mastered`,
      url: window.location.origin,
    }

    if (typeof navigator.share === 'function') {
      void navigator.share(payload).catch(() => {
        // User cancelled or share failed silently
      })
    } else {
      setShareToastMsg('Sharing not supported on this device')
      setShareToastOpen(true)
    }
  }, [streakDays, masteredCount, totalWords])

  const handleShareToastClose = useCallback((): void => {
    setShareToastOpen(false)
  }, [])

  // Knowledge section uses: mastered (ok), learning+familiar (warn), struggling → learning (red)
  // Spec mapping: mastered=ok, learning=warn, struggling=red
  // We map our buckets: mastered=mastered, familiar=learning, learning=struggling
  const knowledgeMastered = buckets.mastered
  const knowledgeLearning = buckets.familiar
  const knowledgeStruggling = buckets.learning

  return (
    <Box
      sx={{
        // PaperSurface provides the background; this box handles scrolling
        overflowY: 'auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="main"
      aria-label="Progress"
    >
      {/* NavBar large */}
      <NavBar
        large
        prominentTitle="Progress"
        trailing={
          <GlassIcon aria-label="Share progress" onClick={handleShare}>
            <Share2 size={20} color={tokens.color.ink} strokeWidth={2} aria-hidden />
          </GlassIcon>
        }
      />

      {/* Content column with screen horizontal padding */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0px', // gaps managed by section margins
          pb: `${BOTTOM_SPACER_PX}px`,
        }}
      >
        {/* Streak hero */}
        <Box sx={{ px: 0, mb: '16px' }}>
          <StreakHero streakDays={streakDays} bestStreak={bestStreak} />
        </Box>

        {/* Stat cards row */}
        <Box
          sx={{
            display: 'flex',
            gap: `${STAT_CARD_GAP}px`,
            px: '16px',
            mb: '4px',
          }}
          role="region"
          aria-label="Stats summary"
        >
          <AccuracyCard current={accuracyCurrent} delta={accuracyDelta} />
          <MasteredCard masteredCount={masteredCount} totalWords={totalWords} />
        </Box>

        {/* This week section */}
        <SectionHeader>This week</SectionHeader>
        <Box sx={{ px: '16px' }}>
          <Glass pad={18} floating>
            <WeekBarChart weekDays={weekDays} todayDate={todayDate} />
          </Glass>
        </Box>

        {/* Knowledge section */}
        <SectionHeader>Knowledge</SectionHeader>
        <Box sx={{ px: '16px' }}>
          <Glass pad={16} floating>
            <KnowledgeBar
              mastered={knowledgeMastered}
              learning={knowledgeLearning}
              struggling={knowledgeStruggling}
            />
          </Glass>
        </Box>
      </Box>

      {/* Share fallback toast */}
      <Snackbar
        open={shareToastOpen}
        autoHideDuration={3000}
        onClose={handleShareToastClose}
        message={shareToastMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StatsScreenProps {
  /** The currently active language pair ID, or null if none. */
  readonly activePairId?: string | null
}

// ─── Public component ─────────────────────────────────────────────────────────

export function StatsScreen({
  activePairId: propPairId,
}: StatsScreenProps = {}): React.JSX.Element {
  const storage = useStorage()
  const [settingsPairId, setSettingsPairId] = useState<string | null>(null)

  // When no activePairId prop is provided, fall back to loading it from settings.
  useEffect(() => {
    if (propPairId !== undefined) return
    void storage.getSettings().then((s) => setSettingsPairId(s.activePairId))
  }, [storage, propPairId])

  const resolvedPairId = propPairId !== undefined ? propPairId : settingsPairId

  return (
    <PaperSurface>
      <StatsContent activePairId={resolvedPairId} />
    </PaperSurface>
  )
}
