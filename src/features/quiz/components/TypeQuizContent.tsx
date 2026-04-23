/**
 * TypeQuizContent — Liquid Glass rebuild.
 *
 * Renders the Typing quiz UI per the iOS 26 Liquid Glass design spec
 * (docs/design/liquid-glass/README.md §3 "Quiz — Typing").
 *
 * What this component does NOT touch:
 *   - useQuizSession (hook state, submitAnswer, advance, endSession)
 *   - Answer validation / typoTolerance (matchAnswer in the hook)
 *   - Spaced repetition recording (recordAttempt in the hook)
 *   - Session lifecycle (phase transitions managed by the hook)
 *
 * Behavioral notes (discovered vs spec):
 *   - "Show answer" records as a miss by submitting a blank string that
 *     will never match. The hook records incorrect via recordAttempt. Spec
 *     says "no confirmation bonus" — confirmed: success state is suppressed.
 *   - "Skip" uses the same mechanism. We advance immediately after the miss
 *     is recorded so the feedback state is bypassed in the UI.
 *   - "Correct/almost" triggers a ~700ms success confirmation then auto-advances.
 *
 * Layout zones (top → bottom):
 *   1. Top bar  — close icon · progress pill · N/M pill
 *   2. Prompt   — LangPair + PoS chip · BigWord · "Translate to …" sub
 *   3. Input    — Glass card with typed text + blink caret · Hint / Skip row
 *   4. Bottom   — Show answer + Check buttons (keyboard-aware)
 *
 * CSS animations:
 *   - @keyframes lg-caret-blink  : steps(2) 1s infinite opacity 0↔1
 *   - @keyframes lg-shake        : horizontal translateX wobble ~400ms
 *   Both are guarded by @media (prefers-reduced-motion: reduce).
 *
 * Keyboard-aware bottom row:
 *   Uses visualViewport.height when available so the buttons float above the
 *   on-screen keyboard. Falls back to position: absolute; bottom: 46px.
 */

import { useState, useCallback, useEffect, useRef, type KeyboardEvent } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { LanguagePair, UserSettings } from '@/types'
import type { UseQuizSessionResult } from '../useQuizSession'
import { Glass } from '@/components/primitives/Glass'
import { PaperSurface } from '@/components/primitives/PaperSurface'
import { LangPair } from '@/components/atoms/LangPair'
import { BigWord } from '@/components/atoms/BigWord'
import { Chip } from '@/components/atoms/Chip'
import { Btn } from '@/components/atoms/Btn'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import { QuizTopBar } from './QuizTopBar'

// ─── Animation keyframes ──────────────────────────────────────────────────────

/**
 * Blinking caret: steps(2) gives an instant 0/1 toggle (not a smooth fade).
 * prefers-reduced-motion: animation is disabled; opacity stays at 0.6.
 */
const CARET_KEYFRAMES = `
  @keyframes lg-caret-blink {
    0%   { opacity: 1; }
    50%  { opacity: 0; }
    100% { opacity: 1; }
  }
` as const

/**
 * Shake: horizontal translateX wobble on the input card.
 * Only transform is animated — NOT background or backdrop-filter — so
 * GPU compositing on the Glass blur is unaffected.
 * prefers-reduced-motion: animation is suppressed entirely.
 */
const SHAKE_KEYFRAMES = `
  @keyframes lg-shake {
    0%   { transform: translateX(0); }
    15%  { transform: translateX(6px); }
    30%  { transform: translateX(-6px); }
    50%  { transform: translateX(4px); }
    70%  { transform: translateX(-4px); }
    85%  { transform: translateX(2px); }
    100% { transform: translateX(0); }
  }
` as const

// ─── Constants ────────────────────────────────────────────────────────────────

/** Milliseconds to display the success confirmation before auto-advancing. */
const AUTO_ADVANCE_MS = 700

// ─── Keyboard viewport hook ───────────────────────────────────────────────────

/**
 * Returns the visible-viewport height so the bottom action row can float
 * above the on-screen keyboard. Falls back to window.innerHeight when
 * visualViewport is unavailable (older browsers / SSR).
 */
function useVisualViewportHeight(): number {
  const getHeight = (): number => {
    if (typeof window === 'undefined') return 812
    return window.visualViewport?.height ?? window.innerHeight
  }

  const [height, setHeight] = useState<number>(getHeight)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const onResize = (): void => {
      setHeight(vv.height)
    }

    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  return height
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TypeQuizContentProps {
  readonly session: UseQuizSessionResult
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TypeQuizContent({ session, pair, settings }: TypeQuizContentProps) {
  // settings reserved for future use (extended hint based on tolerance level)
  void settings

  const { state, submitAnswer, advance, endSession } = session
  const { phase, currentWord, direction, lastResult, wordsCompleted, sessionGoal, error } = state

  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  // Typed input value — always the user's current text
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Shake animation trigger key — bumped on each incorrect answer so React
  // remounts the card element and re-runs the CSS animation from frame 0
  const [shakeKey, setShakeKey] = useState(0)
  const prevResultRef = useRef<string | null>(null)

  // Success state: true for AUTO_ADVANCE_MS after a correct/almost result
  const [isSuccess, setIsSuccess] = useState(false)

  // showingAnswer: true when "Show answer" was clicked — we display the
  // correct answer in the input card but skip the success confirmation
  const [showingAnswer, setShowingAnswer] = useState(false)

  // skipPending: true when "Skip" is clicked — the feedback effect should
  // immediately call advance() without displaying any feedback UI
  const skipPendingRef = useRef(false)

  // Keyboard-aware viewport height
  const viewportHeight = useVisualViewportHeight()

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Focus the hidden input whenever we enter question phase
  useEffect(() => {
    if (phase === 'question' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase, currentWord])

  // Reset local state on each new question
  useEffect(() => {
    if (phase === 'question') {
      setInputValue('')
      setIsSuccess(false)
      setShowingAnswer(false)
    }
  }, [phase, currentWord])

  // React to feedback phase transitions
  useEffect(() => {
    if (phase === 'feedback' && lastResult !== null) {
      const result = lastResult.result

      // Skip: bypass feedback display entirely; advance immediately
      if (skipPendingRef.current) {
        skipPendingRef.current = false
        advance()
        return
      }

      // Show answer: display the answer but no success state; wait for manual advance
      if (showingAnswer) {
        prevResultRef.current = result
        return
      }

      // Correct / almost: brief success confirmation, then auto-advance
      if (result === 'correct' || result === 'almost') {
        setIsSuccess(true)
        const timer = setTimeout(() => {
          advance()
        }, AUTO_ADVANCE_MS)
        prevResultRef.current = result
        return () => clearTimeout(timer)
      }

      // Incorrect: trigger shake animation
      if (result === 'incorrect' && prevResultRef.current !== 'incorrect') {
        setShakeKey((k) => k + 1)
      }
      prevResultRef.current = result
    } else if (phase === 'question') {
      prevResultRef.current = null
    }
  }, [phase, lastResult, showingAnswer, advance])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCheck = useCallback(async (): Promise<void> => {
    if (inputValue.trim() === '') return
    await submitAnswer(inputValue)
  }, [inputValue, submitAnswer])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        void handleCheck()
      }
    },
    [handleCheck],
  )

  const handleShowAnswer = useCallback(async (): Promise<void> => {
    // Mark so the feedback effect shows the answer without success state
    setShowingAnswer(true)
    // Submit a non-matching string so the hook records an incorrect attempt
    await submitAnswer('​') // zero-width space — guaranteed not to match
  }, [submitAnswer])

  const handleSkip = useCallback(async (): Promise<void> => {
    // Set the ref flag before the async call so the effect sees it
    skipPendingRef.current = true
    // Record as miss
    await submitAnswer('​')
    // The feedback effect will call advance() immediately when it runs
  }, [submitAnswer])

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

  if (phase === 'finished') return null

  // ─── Derived values ───────────────────────────────────────────────────────

  const fromCode = direction === 'source-to-target' ? pair.sourceCode : pair.targetCode
  const toCode = direction === 'source-to-target' ? pair.targetCode : pair.sourceCode
  const toLang = direction === 'source-to-target' ? pair.targetLang : pair.sourceLang
  const questionText =
    direction === 'source-to-target' ? (currentWord?.source ?? '') : (currentWord?.target ?? '')
  const correctAnswer =
    direction === 'source-to-target' ? (currentWord?.target ?? '') : (currentWord?.source ?? '')

  // Hint data
  const hintFirst = correctAnswer.length > 0 ? correctAnswer[0] : '?'
  const hintLength = correctAnswer.length

  // Part of speech: extracted from word notes when the note starts with a
  // known POS keyword. Shown in the accent Chip next to LangPair.
  const partOfSpeech = (() => {
    const notes = currentWord?.notes ?? ''
    const match = notes.match(/^(noun|verb|adj(?:ective)?|adverb|phrase|conjunction|preposition)/i)
    return match ? match[1].toLowerCase() : null
  })()

  // Feedback state flags
  const isFeedback = phase === 'feedback' && lastResult !== null
  const isIncorrect = isFeedback && lastResult?.result === 'incorrect'
  // When reveal is active, show the correct answer text
  const isReveal = isIncorrect || showingAnswer
  const revealText = lastResult?.correctAnswer ?? correctAnswer

  // ─── Keyboard-aware bottom offset ─────────────────────────────────────────
  // When the on-screen keyboard is open, viewportHeight < window.innerHeight.
  // We push the button row up by the difference so it stays above the keyboard.
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : viewportHeight
  const keyboardOverlap = Math.max(0, windowHeight - viewportHeight)
  // 46px = design spec bottom offset + keyboard overlap
  const bottomOffset = 46 + keyboardOverlap

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <PaperSurface
      sx={{
        // Establishes position context for the absolute bottom row
        position: 'relative',
        // Reserve space below content for the absolute button row (56 = lg Btn height)
        pb: `${bottomOffset + 56 + 16}px`,
      }}
    >
      {/* Inject CSS keyframes once */}
      <style>{CARET_KEYFRAMES}</style>
      <style>{SHAKE_KEYFRAMES}</style>

      {/* ── Zone 1: Top bar ────────────────────────────────────────────────── */}
      <QuizTopBar progress={{ current: wordsCompleted, total: sessionGoal }} onClose={endSession} />

      {/* ── Zone 2: Prompt area ─────────────────────────────────────────────── */}
      <Box sx={{ padding: '40px 24px 0' }}>
        {/* LangPair + part-of-speech chip row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <LangPair from={fromCode.toUpperCase()} to={toCode.toUpperCase()} />
          {partOfSpeech !== null && <Chip tone="accent">{partOfSpeech}</Chip>}
        </Box>

        {/* Term */}
        <Box
          sx={{ mt: '12px' }}
          role="heading"
          aria-level={2}
          aria-label={`Translate: ${questionText}`}
        >
          <BigWord size={64} weight={800}>
            {questionText}
          </BigWord>
        </Box>

        {/* "Translate to {targetLang}" subtitle */}
        <Typography
          sx={{
            mt: '10px',
            fontFamily: glassTypography.body,
            fontSize: glassTypography.roles.quizSub.size,
            fontWeight: glassTypography.roles.quizSub.weight,
            letterSpacing: glassTypography.roles.quizSub.tracking,
            color: tokens.color.inkSec,
          }}
        >
          Translate to {toLang}
        </Typography>
      </Box>

      {/* ── Zone 3: Input / feedback area ───────────────────────────────────── */}
      <Box sx={{ padding: '36px 16px 0' }}>
        {/*
         * Input card wrapper — key prop with shakeKey forces remount on each
         * incorrect answer so the CSS animation restarts from frame 0.
         * We apply shake only when in incorrect feedback state.
         */}
        <Box
          key={isIncorrect ? `shake-${shakeKey}` : 'input-card'}
          sx={{
            animation: isIncorrect ? 'lg-shake 400ms ease-in-out' : undefined,
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none !important',
            },
          }}
        >
          <Glass pad={18} floating strong>
            {/* ── Success state ── */}
            {isSuccess && (
              <Box
                role="status"
                aria-live="polite"
                sx={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: 32 }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: tokens.color.ok,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    fontFamily: glassTypography.display,
                    fontSize: glassTypography.roles.quizDisplay.size,
                    fontWeight: glassTypography.roles.quizDisplay.weight,
                    letterSpacing: glassTypography.roles.quizDisplay.tracking,
                    lineHeight: glassTypography.roles.quizDisplay.lineHeight,
                    color: tokens.color.ok,
                    wordBreak: 'break-word',
                  }}
                >
                  Correct!
                </Typography>
              </Box>
            )}

            {/* ── Reveal state (incorrect / show-answer) ── */}
            {!isSuccess && isReveal && (
              <Box role="status" aria-live="polite">
                {showingAnswer ? (
                  // Show answer without wrong-answer styling
                  <Typography
                    sx={{
                      fontFamily: glassTypography.display,
                      fontSize: glassTypography.roles.quizDisplay.size,
                      fontWeight: glassTypography.roles.quizDisplay.weight,
                      letterSpacing: glassTypography.roles.quizDisplay.tracking,
                      lineHeight: glassTypography.roles.quizDisplay.lineHeight,
                      color: tokens.color.inkSoft,
                      wordBreak: 'break-word',
                    }}
                  >
                    {revealText}
                  </Typography>
                ) : (
                  // Wrong answer: user text in red + correct answer below
                  <>
                    <Typography
                      sx={{
                        fontFamily: glassTypography.display,
                        fontSize: glassTypography.roles.quizDisplay.size,
                        fontWeight: glassTypography.roles.quizDisplay.weight,
                        letterSpacing: glassTypography.roles.quizDisplay.tracking,
                        lineHeight: glassTypography.roles.quizDisplay.lineHeight,
                        color: tokens.color.red,
                        wordBreak: 'break-word',
                      }}
                    >
                      {inputValue || ' '}
                    </Typography>
                    <Typography
                      sx={{
                        mt: '8px',
                        fontFamily: glassTypography.body,
                        fontSize: glassTypography.roles.quizHint.size,
                        fontWeight: glassTypography.roles.quizHint.weight,
                        letterSpacing: glassTypography.roles.quizHint.tracking,
                        color: tokens.color.inkSec,
                      }}
                    >
                      {'Correct: '}
                      <Box component="span" sx={{ color: tokens.color.ok, fontWeight: 700 }}>
                        {revealText}
                      </Box>
                    </Typography>
                  </>
                )}
              </Box>
            )}

            {/* ── Typing state ── */}
            {!isSuccess && !isReveal && (
              <Box
                sx={{ position: 'relative', cursor: 'text' }}
                onClick={() => inputRef.current?.focus()}
              >
                {/*
                 * Visually-hidden real <input> — captures keyboard input.
                 * Positioned absolutely over the display area so tap events
                 * reach it without affecting layout. Opacity 0 makes it invisible
                 * while remaining focusable and accessible to screen readers.
                 */}
                <Box
                  component="input"
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setInputValue(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  aria-label={`Type the ${toLang} translation`}
                  lang={toCode}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    border: 'none',
                    background: 'none',
                    outline: 'none',
                    cursor: 'text',
                    zIndex: 1,
                    // Ensure it covers the display row
                    minHeight: 32,
                    width: '100%',
                  }}
                />

                {/* Display row: typed text + blinking caret (aria-hidden) */}
                <Box
                  aria-hidden="true"
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    minHeight: 32,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: glassTypography.display,
                      fontSize: glassTypography.roles.quizDisplay.size,
                      fontWeight: glassTypography.roles.quizDisplay.weight,
                      letterSpacing: glassTypography.roles.quizDisplay.tracking,
                      lineHeight: glassTypography.roles.quizDisplay.lineHeight,
                      color: tokens.color.ink,
                      wordBreak: 'break-all',
                    }}
                  >
                    {inputValue}
                  </Typography>

                  {/* 2×24 accent caret with steps(2) blink */}
                  <Box
                    component="span"
                    aria-hidden="true"
                    sx={{
                      display: 'inline-block',
                      width: 2,
                      height: 24,
                      backgroundColor: tokens.color.accent,
                      borderRadius: 1,
                      ml: '1px',
                      verticalAlign: 'middle',
                      animation: 'lg-caret-blink steps(2) 1s infinite',
                      // Reduce Motion: steady caret, no blink
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none',
                        opacity: 0.6,
                      },
                    }}
                  />
                </Box>
              </Box>
            )}
          </Glass>
        </Box>

        {/* Hint / Skip row — only during question phase */}
        {phase === 'question' && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: '12px',
            }}
          >
            <Typography
              sx={{
                fontFamily: glassTypography.body,
                fontSize: glassTypography.roles.quizHint.size,
                fontWeight: glassTypography.roles.quizHint.weight,
                letterSpacing: glassTypography.roles.quizHint.tracking,
                color: tokens.color.inkSec,
              }}
            >
              {'Hint: starts with '}
              <Box component="strong" sx={{ color: tokens.color.ink, fontWeight: 700 }}>
                {hintFirst}
              </Box>
              {`, ${hintLength} letters`}
            </Typography>

            <Box
              component="button"
              onClick={() => void handleSkip()}
              aria-label="Skip this word"
              sx={{
                background: 'none',
                border: 'none',
                padding: '4px 0 4px 12px',
                cursor: 'pointer',
                fontFamily: glassTypography.body,
                fontSize: glassTypography.roles.quizHint.size,
                fontWeight: 700,
                letterSpacing: glassTypography.roles.quizHint.tracking,
                color: tokens.color.accent,
                lineHeight: 1,
              }}
            >
              Skip
            </Box>
          </Box>
        )}

        {/* "Next word" / "See results" button — after feedback, not during auto-advance */}
        {isFeedback && !isSuccess && (
          <Box sx={{ mt: '16px' }}>
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
      </Box>

      {/* ── Zone 4: Bottom action row (keyboard-aware, absolute) ─────────────── */}
      {phase === 'question' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: `${bottomOffset}px`,
            left: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            alignItems: 'stretch',
          }}
        >
          {/* Show answer — flex 1 */}
          <Box sx={{ flex: 1 }}>
            <Btn
              kind="glass"
              size="lg"
              full
              onClick={() => void handleShowAnswer()}
              aria-label="Show answer"
            >
              Show answer
            </Btn>
          </Box>

          {/* Check — flex 1.3 */}
          <Box sx={{ flex: 1.3 }}>
            <Btn
              kind="filled"
              size="lg"
              full
              onClick={() => void handleCheck()}
              disabled={inputValue.trim() === ''}
              aria-label="Check answer"
            >
              Check
            </Btn>
          </Box>
        </Box>
      )}
    </PaperSurface>
  )
}
