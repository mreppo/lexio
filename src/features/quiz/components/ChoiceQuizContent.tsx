/**
 * ChoiceQuizContent — Liquid Glass rebuild.
 *
 * Renders the Multiple Choice quiz UI per the iOS 26 Liquid Glass design spec
 * (docs/design/liquid-glass/README.md §4 "Quiz — Multiple Choice").
 *
 * What this component does NOT touch:
 *   - useQuizSession (hook state, selectOption, advance, endSession)
 *   - Answer validation / distractor generation (in the hook)
 *   - Spaced repetition recording (recordAttempt in the hook)
 *   - Session lifecycle (phase transitions managed by the hook)
 *
 * Layout zones (top → bottom):
 *   1. Top bar  — shared <QuizTopBar> component (close · progress · N/M pill)
 *   2. Prompt   — centered: LangPair · BigWord (size=66, mt=14) · "Choose the meaning" (mt=12)
 *   3. Options  — 4 Glass option cards (A/B/C/D letter square + label), gap=10
 *   4. Bottom   — absolute: feedback card + "Next word" button (after first tap)
 *
 * Option states:
 *   - idle     : glassBg fill, letter in inkSoft
 *   - correct  : 2px ok border + strong fill; 30×30 square ok-filled + white check
 *   - wrong    : 2px red border + strong fill; 30×30 square red-filled + white X
 *   - reveal   : correct state shown on the correct answer when user chose wrong
 *
 * Tap-gate:
 *   After the first tap, all option buttons are disabled until "Next word" is pressed.
 *   This is enforced by `selectedIndex !== -1` in the hook (it guards selectOption).
 *   We additionally disable pointer-events on all options once isAnswered is true.
 *
 * XP display:
 *   Math.round(lastConfidenceDelta * 100). Shown only when delta > 0 (correct answer).
 *
 * CSS animations:
 *   - @keyframes lg-mc-feedback-in : opacity 0→1 + translateY 8px→0 for feedback card
 *   Both guarded by @media (prefers-reduced-motion: reduce).
 */

import { useCallback, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { LanguagePair } from '@/types'
import type { UseQuizSessionResult } from '../useQuizSession'
import { Glass } from '@/components/primitives/Glass'
import { PaperSurface } from '@/components/primitives/PaperSurface'
import { LangPair } from '@/components/atoms/LangPair'
import { BigWord } from '@/components/atoms/BigWord'
import { Btn } from '@/components/atoms/Btn'
import { IconGlyph } from '@/components/atoms/IconGlyph'
import {
  getGlassTokens,
  glassTypography,
  glassRadius,
  okAlpha,
  type GlassVariantTokens,
} from '@/theme/liquidGlass'
import { MIN_WORDS_FOR_CHOICE } from '@/utils/distractorGenerator'
import { QuizTopBar } from './QuizTopBar'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Letter labels for options. Supports up to 26 options (A–Z). */
const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Milliseconds to auto-advance after a correct answer. */
const AUTO_ADVANCE_MS = 1200

/** Feedback card slide-in animation keyframes. */
const FEEDBACK_KEYFRAMES = `
  @keyframes lg-mc-feedback-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
` as const

// ─── Types ────────────────────────────────────────────────────────────────────

type OptionState = 'idle' | 'correct' | 'wrong' | 'reveal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determines the visual state for a single option card.
 *
 * Rules:
 * - If no answer has been given yet (selectedIndex === -1): all options are idle.
 * - The selected option is either correct or wrong.
 * - The correct option when a wrong answer was given: reveal (shown as correct).
 * - All other options: idle.
 */
function getOptionState(index: number, correctIndex: number, selectedIndex: number): OptionState {
  if (selectedIndex === -1) return 'idle'
  if (index === correctIndex && index === selectedIndex) return 'correct'
  if (index === selectedIndex && index !== correctIndex) return 'wrong'
  if (index === correctIndex && selectedIndex !== correctIndex) return 'reveal'
  return 'idle'
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ChoiceQuizContentProps {
  readonly session: UseQuizSessionResult
  readonly pair: LanguagePair | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChoiceQuizContent({
  session,
  pair,
}: ChoiceQuizContentProps): React.JSX.Element | null {
  const { state, selectOption, advance, endSession } = session
  const {
    phase,
    currentWord,
    direction,
    options,
    correctIndex,
    selectedIndex,
    lastChoiceCorrect,
    lastConfidenceDelta,
    wordsCompleted,
    sessionGoal,
    error,
  } = state

  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const isAnswered = selectedIndex !== -1

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSelect = useCallback(
    (index: number): void => {
      void selectOption(index)
    },
    [selectOption],
  )

  // Auto-advance after a short delay when the correct answer is selected.
  // For incorrect answers the user needs time to review, so we keep manual advance.
  useEffect(() => {
    if (!isAnswered || lastChoiceCorrect !== true) return

    const timer = setTimeout(() => {
      advance()
    }, AUTO_ADVANCE_MS)

    return () => clearTimeout(timer)
  }, [isAnswered, lastChoiceCorrect, advance])

  // ─── Early returns ────────────────────────────────────────────────────────

  if (pair === null) {
    return (
      <PaperSurface>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography
            sx={{ color: tokens.color.inkSec, fontFamily: glassTypography.body, fontSize: 16 }}
          >
            Select a language pair to start quizzing.
          </Typography>
        </Box>
      </PaperSurface>
    )
  }

  if (phase === 'loading') {
    return (
      <PaperSurface>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography
            sx={{ color: tokens.color.inkSec, fontFamily: glassTypography.body, fontSize: 16 }}
          >
            Loading words...
          </Typography>
        </Box>
      </PaperSurface>
    )
  }

  if (phase === 'not-enough-words') {
    return (
      <PaperSurface>
        <Box sx={{ padding: '80px 24px 0' }}>
          <Typography
            sx={{
              color: tokens.color.warn,
              fontFamily: glassTypography.display,
              fontSize: 20,
              fontWeight: 700,
              mb: 1,
            }}
          >
            Not enough words
          </Typography>
          <Typography
            sx={{ color: tokens.color.inkSec, fontFamily: glassTypography.body, fontSize: 15 }}
          >
            Multiple choice mode requires at least {MIN_WORDS_FOR_CHOICE} words in this language
            pair. Add more words to your word list to use multiple choice mode.
          </Typography>
        </Box>
      </PaperSurface>
    )
  }

  if (phase === 'finished' && error !== null) {
    return (
      <PaperSurface>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography
            sx={{
              color: tokens.color.red,
              fontFamily: glassTypography.display,
              fontSize: 20,
              fontWeight: 700,
              mb: 1,
            }}
          >
            Something went wrong
          </Typography>
          <Typography sx={{ color: tokens.color.inkSec, fontFamily: glassTypography.body }}>
            {error}
          </Typography>
        </Box>
      </PaperSurface>
    )
  }

  // Finished without error: parent handles transition.
  if (phase === 'finished') return null

  // ─── Derived values ───────────────────────────────────────────────────────

  const fromCode = direction === 'source-to-target' ? pair.sourceCode : pair.targetCode
  const toCode = direction === 'source-to-target' ? pair.targetCode : pair.sourceCode
  const toLang = direction === 'source-to-target' ? pair.targetLang : pair.sourceLang
  const questionText =
    direction === 'source-to-target' ? (currentWord?.source ?? '') : (currentWord?.target ?? '')

  // XP: confidence delta * 100, rounded, shown only when positive (correct answer)
  const xpGain =
    lastConfidenceDelta !== null && lastConfidenceDelta > 0
      ? Math.round(lastConfidenceDelta * 100)
      : null

  // Explanation text: use word notes when available, otherwise show the correct answer
  const correctAnswer = options[correctIndex] ?? ''
  const explanation = currentWord?.notes ?? null

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <PaperSurface
      sx={{
        position: 'relative',
        // Reserve space for the absolute bottom section (feedback card + next btn)
        pb: isAnswered ? '160px' : '0px',
      }}
    >
      {/* Inject animation keyframes once */}
      <style>{FEEDBACK_KEYFRAMES}</style>

      {/* ── Zone 1: Top bar ─────────────────────────────────────────────────── */}
      <QuizTopBar progress={{ current: wordsCompleted, total: sessionGoal }} onClose={endSession} />

      {/* ── Zone 2: Prompt area ──────────────────────────────────────────────── */}
      {/*
       * Spec: padding 36 24 0, centered.
       * LangPair centered, BigWord size=66 mt=14,
       * "Choose the meaning" 14/500 inkSec mt=12.
       */}
      <Box
        sx={{
          padding: '36px 24px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* LangPair — centered */}
        <LangPair from={fromCode.toUpperCase()} to={toCode.toUpperCase()} />

        {/* Term — BigWord size=66, mt=14 */}
        <Box
          sx={{ mt: '14px' }}
          role="heading"
          aria-level={2}
          aria-label={`Translate: ${questionText}`}
        >
          <BigWord size={66} weight={800}>
            {questionText}
          </BigWord>
        </Box>

        {/* "Choose the meaning" subtitle — 14/500 inkSec, mt=12 */}
        <Typography
          sx={{
            mt: '12px',
            fontFamily: glassTypography.body,
            fontSize: glassTypography.roles.quizChoiceSub.size,
            fontWeight: glassTypography.roles.quizChoiceSub.weight,
            letterSpacing: glassTypography.roles.quizChoiceSub.tracking,
            color: tokens.color.inkSec,
          }}
        >
          Choose the {toLang} meaning
        </Typography>
      </Box>

      {/* ── Zone 3: Options area ─────────────────────────────────────────────── */}
      {/*
       * Spec: padding 34 16 0, flex column gap 10.
       * Each option: Glass pad=0 floating with 30×30 letter square + label 17/600.
       * Inner padding 14 16, gap 14.
       */}
      <Box
        sx={{ padding: '34px 16px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}
        role="group"
        aria-label={`Choose the ${toLang} meaning`}
      >
        {options.map((option, index) => {
          const optionState = getOptionState(index, correctIndex, selectedIndex)
          const letter = OPTION_LETTERS[index] ?? String(index + 1)

          return (
            <OptionCard
              key={`${option}-${index}`}
              letter={letter}
              label={option}
              state={optionState}
              isAnswered={isAnswered}
              onClick={() => handleSelect(index)}
              tokens={tokens}
            />
          )
        })}
      </Box>

      {/* ── Zone 4: Feedback + Next button (absolute bottom) ─────────────────── */}
      {isAnswered && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 46,
            left: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'lg-mc-feedback-in 250ms ease-out',
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          }}
        >
          {/* Feedback card */}
          <FeedbackCard
            isCorrect={lastChoiceCorrect === true}
            xpGain={xpGain}
            correctAnswer={correctAnswer}
            explanation={explanation}
            tokens={tokens}
            themeMode={theme.palette.mode}
          />

          {/* Next word / See results button */}
          <Btn
            kind="filled"
            size="lg"
            full
            onClick={advance}
            aria-label={wordsCompleted >= sessionGoal ? 'See results' : 'Next word'}
          >
            {wordsCompleted >= sessionGoal ? 'See results' : 'Next word'}
          </Btn>
        </Box>
      )}
    </PaperSurface>
  )
}

// ─── OptionCard ───────────────────────────────────────────────────────────────

interface OptionCardProps {
  readonly letter: string
  readonly label: string
  readonly state: OptionState
  readonly isAnswered: boolean
  readonly onClick: () => void
  readonly tokens: GlassVariantTokens
}

/**
 * A single option button card.
 *
 * Structure: Glass pad=0 floating, with inner padding 14 16 and gap 14
 * between the 30×30 letter square and the option label.
 *
 * Border and fill are controlled by `state`:
 *   - idle    : default glassBg
 *   - correct : 2px ok border + strong fill
 *   - wrong   : 2px red border + strong fill
 *   - reveal  : 2px ok border + strong fill (correct answer revealed)
 */
function OptionCard({
  letter,
  label,
  state,
  isAnswered,
  onClick,
  tokens,
}: OptionCardProps): React.JSX.Element {
  const isCorrectState = state === 'correct' || state === 'reveal'
  const isWrongState = state === 'wrong'

  // Border overrides per state — these are applied via sx on the <Glass> outer wrapper
  const borderColor = isCorrectState ? tokens.color.ok : isWrongState ? tokens.color.red : undefined

  // Use strong fill when in a result state
  const useStrong = isCorrectState || isWrongState

  return (
    <Box
      component="button"
      disabled={isAnswered}
      onClick={onClick}
      aria-label={`Option ${letter}: ${label}`}
      aria-pressed={state === 'correct' || state === 'wrong'}
      sx={{
        // Reset button styles
        display: 'block',
        width: '100%',
        border: 'none',
        background: 'none',
        padding: 0,
        cursor: isAnswered ? 'default' : 'pointer',
        textAlign: 'left',
        // Prevent re-tapping during feedback
        pointerEvents: isAnswered ? 'none' : 'auto',
        // Pressed scale feedback
        '&:active:not(:disabled)': {
          transform: 'scale(0.98)',
          transition: 'transform 80ms ease',
        },
      }}
    >
      <Glass
        pad={0}
        floating
        strong={useStrong}
        sx={{
          // State border: 2px ok / red around the whole card
          outline: borderColor ? `2px solid ${borderColor}` : undefined,
          outlineOffset: '-1px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '14px 16px',
            gap: '14px',
          }}
        >
          {/* 30×30 letter square */}
          <LetterSquare letter={letter} state={state} tokens={tokens} />

          {/* Option label — 17/600 ink, word-break for long strings */}
          <Typography
            component="span"
            sx={{
              fontFamily: glassTypography.body,
              fontSize: glassTypography.roles.quizOption.size,
              fontWeight: glassTypography.roles.quizOption.weight,
              letterSpacing: glassTypography.roles.quizOption.tracking,
              color: tokens.color.ink,
              wordBreak: 'break-word',
              flex: 1,
              lineHeight: glassTypography.roles.quizOption.lineHeight,
            }}
          >
            {label}
          </Typography>
        </Box>
      </Glass>
    </Box>
  )
}

// ─── LetterSquare ─────────────────────────────────────────────────────────────

interface LetterSquareProps {
  readonly letter: string
  readonly state: OptionState
  readonly tokens: GlassVariantTokens
}

/**
 * The 30×30 rounded letter square inside each option card.
 *
 * Spec:
 *   - idle    : glassBg fill, 0.5px rim, letter 13/800 inkSoft
 *   - correct : ok-filled, white check icon
 *   - wrong   : red-filled, white X icon
 *   - reveal  : ok-filled, white check icon (correct answer revealed)
 */
function LetterSquare({ letter, state, tokens }: LetterSquareProps): React.JSX.Element {
  const isCorrectState = state === 'correct' || state === 'reveal'
  const isWrongState = state === 'wrong'

  const bgColor = isCorrectState
    ? tokens.color.ok
    : isWrongState
      ? tokens.color.red
      : tokens.glass.bg

  const squareRadius = glassRadius.iconSquare // 10px — spec says "radius 9" we use 10 per iconSquare token

  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 30,
        height: 30,
        borderRadius: `${squareRadius}px`,
        backgroundColor: bgColor,
        // Rim on idle state only (mimicking glassBg 0.5px border)
        border: isCorrectState || isWrongState ? 'none' : `0.5px solid ${tokens.glass.border}`,
        boxShadow: isCorrectState || isWrongState ? 'none' : tokens.glass.inner,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {isCorrectState ? (
        // White check mark
        <IconGlyph name="check" size={14} color="#ffffff" decorative />
      ) : isWrongState ? (
        // White X
        <IconGlyph name="x" size={14} color="#ffffff" decorative />
      ) : (
        // Letter A/B/C/D — 13/800 inkSoft
        <Typography
          component="span"
          sx={{
            fontFamily: glassTypography.body,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: -0.1,
            lineHeight: 1,
            color: tokens.color.inkSoft,
            userSelect: 'none',
          }}
        >
          {letter}
        </Typography>
      )}
    </Box>
  )
}

// ─── FeedbackCard ─────────────────────────────────────────────────────────────

interface FeedbackCardProps {
  readonly isCorrect: boolean
  /** Positive XP gain to display (null → don't show XP). */
  readonly xpGain: number | null
  /** The correct answer text (option label). */
  readonly correctAnswer: string
  /** Optional explanation from word notes. */
  readonly explanation: string | null
  readonly tokens: GlassVariantTokens
  /** Theme mode for okAlpha helper. */
  readonly themeMode: 'light' | 'dark'
}

/**
 * Feedback card shown below the options after the user taps an answer.
 *
 * Spec: Glass pad=14 floating strong, with:
 *   - Correct: 1px ok@40 border, row (22×22 ok circle + check, "Correct · +N XP" 15/700 ok)
 *     + optional explanation 13/500 inkSoft mt=6 line-height 1.4
 *   - Wrong: "Not quite · correct answer: {answer}" 15/700 red, no XP number
 */
function FeedbackCard({
  isCorrect,
  xpGain,
  correctAnswer,
  explanation,
  tokens,
  themeMode,
}: FeedbackCardProps): React.JSX.Element {
  const borderColor = isCorrect ? okAlpha(themeMode, 0.4) : `${tokens.color.red}66`

  return (
    <Glass
      pad={14}
      floating
      strong
      sx={{
        border: `1px solid ${borderColor}`,
      }}
    >
      <Box role="status" aria-live="polite">
        {/* Headline row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 22×22 circle with check or X */}
          <Box
            aria-hidden="true"
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: isCorrect ? tokens.color.ok : tokens.color.red,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconGlyph name={isCorrect ? 'check' : 'x'} size={12} color="#ffffff" decorative />
          </Box>

          {/* Headline text */}
          <Typography
            component="span"
            sx={{
              fontFamily: glassTypography.body,
              fontSize: glassTypography.roles.quizFeedbackHeadline.size,
              fontWeight: glassTypography.roles.quizFeedbackHeadline.weight,
              letterSpacing: glassTypography.roles.quizFeedbackHeadline.tracking,
              color: isCorrect ? tokens.color.ok : tokens.color.red,
              lineHeight: glassTypography.roles.quizFeedbackHeadline.lineHeight,
            }}
          >
            {isCorrect
              ? xpGain !== null
                ? `Correct · +${xpGain} XP`
                : 'Correct!'
              : `Not quite · correct: ${correctAnswer}`}
          </Typography>
        </Box>

        {/* Explanation — shown for correct answers when notes are available */}
        {isCorrect && explanation !== null && (
          <Typography
            sx={{
              mt: '6px',
              fontFamily: glassTypography.body,
              fontSize: glassTypography.roles.quizExplanation.size,
              fontWeight: glassTypography.roles.quizExplanation.weight,
              letterSpacing: glassTypography.roles.quizExplanation.tracking,
              color: tokens.color.inkSoft,
              lineHeight: glassTypography.roles.quizExplanation.lineHeight,
            }}
          >
            {explanation}
          </Typography>
        )}
      </Box>
    </Glass>
  )
}
