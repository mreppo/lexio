/**
 * AddWordModal — Liquid Glass "Add Word" full-screen modal (issue #150).
 *
 * Layout (top to bottom):
 *   1. Custom nav row  padding 56 20 12: Cancel · New Word · Save
 *   2. Term Glass card  — uppercase label + display-size input
 *   3. Meaning Glass card — uppercase label + 20/500 input
 *   4. SectionHeader "Part of speech" + chip row (5 options, single-select)
 *   5. SectionHeader "Example" + Glass italic input
 *   6. AI upsell Glass card (STUBBED — button disabled, no network call)
 *
 * Delivery: MUI Dialog fullScreen → PaperSurface as content root.
 * Wallpaper renders inside the modal (PaperSurface carries the background).
 *
 * Toast: inline MUI Snackbar shown on successful save.
 *
 * Modal-vs-tab note:
 *   This modal overlays the Words/Library tab. It does NOT render <TabBar>
 *   and does NOT add new branches to AppContent.tsx. The TabBar is hidden
 *   behind the modal overlay naturally.
 *
 * Amendment compliance:
 *   Screen renders <PaperSurface> wrapping content; does NOT render <TabBar>.
 *   The underlying Library keeps its normal TabBar rendering — the modal just
 *   overlays it. No AppContent.tsx changes needed for a Dialog.
 *
 * Caret blink:
 *   @keyframes lg-caret-blink promoted to src/theme/animations.ts; imported
 *   and injected here as a <style> element.
 *
 * AI upsell:
 *   NO network call, NO API key, NO env var, NO spinner.
 *   Button is disabled (opacity 0.6, cursor not-allowed). Copy: "Coming soon".
 *   Gradient circle uses glassColors.aiGradient token.
 */

import { useState, useCallback, useEffect, useId } from 'react'
import { Box, Dialog, Snackbar, Alert } from '@mui/material'
import { Sparkles } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { PaperSurface } from '@/components/primitives/PaperSurface'
import { Glass } from '@/components/primitives/Glass'
import { SectionHeader } from '@/components/composites/SectionHeader'
import { getGlassTokens, glassTypography, glassShadows } from '@/theme/liquidGlass'
import { CARET_BLINK_KEYFRAMES } from '@/theme/animations'
import { useWords } from '../useWords'
import type { PartOfSpeech } from '../partOfSpeech'
import { PART_OF_SPEECH_OPTIONS } from '../partOfSpeech'

export interface AddWordModalProps {
  /** Whether the modal is open. */
  readonly open: boolean
  /** Called when the modal should close (Cancel or successful Save). */
  readonly onClose: () => void
  /** The active language pair id — required to save a word. */
  readonly pairId: string
  /** Source language code, shown in Term label e.g. "TERM · ES". */
  readonly fromCode: string
  /** Target language code, shown in Meaning label e.g. "MEANING · EN". */
  readonly toCode: string
}

// ─── Nav Row ─────────────────────────────────────────────────────────────────

interface ModalNavRowProps {
  readonly onCancel: () => void
  readonly onSave: () => void
  readonly saveDisabled: boolean
  readonly titleId: string
}

/**
 * Custom nav row per AC: padding 56 20 12, three-column flex-between.
 * Cancel: 17/500 accent. Title "New Word": 17/700 ink. Save: 17/700 accent.
 */
function ModalNavRow({
  onCancel,
  onSave,
  saveDisabled,
  titleId,
}: ModalNavRowProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const navBtnBaseSx = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontFamily: glassTypography.body,
    fontSize: '17px',
    letterSpacing: '-0.3px',
    lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
    transition: 'opacity 120ms ease',
    '&:active': { opacity: 0.7 },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      '&:active': { opacity: 1 },
    },
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Spec: padding 56 20 12 (top right bottom left = 56 20)
        paddingTop: '56px',
        paddingBottom: '12px',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}
    >
      {/* Cancel — 17/500 accent */}
      <Box
        component="button"
        type="button"
        onClick={onCancel}
        aria-label="Cancel and close modal"
        sx={{
          ...navBtnBaseSx,
          fontWeight: 500,
          color: tokens.color.accent,
        }}
      >
        Cancel
      </Box>

      {/* New Word — 17/700 ink (modal title) */}
      <Box
        component="h1"
        id={titleId}
        sx={{
          margin: 0,
          fontFamily: glassTypography.body,
          fontSize: '17px',
          fontWeight: 700,
          letterSpacing: '-0.3px',
          lineHeight: 1,
          color: tokens.color.ink,
        }}
      >
        New Word
      </Box>

      {/* Save — 17/700 accent, disabled until Term + Meaning filled */}
      <Box
        component="button"
        type="button"
        onClick={saveDisabled ? undefined : onSave}
        disabled={saveDisabled}
        aria-label="Save new word"
        sx={{
          ...navBtnBaseSx,
          fontWeight: 700,
          color: saveDisabled ? tokens.color.inkFaint : tokens.color.accent,
          cursor: saveDisabled ? 'not-allowed' : 'pointer',
          opacity: saveDisabled ? 0.5 : 1,
          '&:active': saveDisabled ? { opacity: 0.5 } : { opacity: 0.7 },
        }}
      >
        Save
      </Box>
    </Box>
  )
}

// ─── Input Glass Card ─────────────────────────────────────────────────────────

interface InputGlassCardProps {
  /** Uppercase label text e.g. "TERM · ES". */
  readonly label: string
  /** Current value of the input. */
  readonly value: string
  /** Called when the user changes the input. */
  readonly onChange: (v: string) => void
  /** CSS font-size for the value input. */
  readonly fontSize: string
  /** CSS font-weight for the value input. */
  readonly fontWeight: number
  /** CSS letter-spacing for the value input. */
  readonly letterSpacing: string
  /** If true, render the input as italic (Example field). */
  readonly italic?: boolean
  /** Text colour token for the value input. Defaults to tokens.color.ink. */
  readonly valueColor?: string
  /** Accessible label for the input element. */
  readonly inputAriaLabel: string
  /** Optional sx for the outer margin. */
  readonly marginBottom?: string
}

/**
 * Glass card (pad=16, floating) with an uppercase label + editable input.
 * Blinking caret shown while the input is focused.
 * Input uses lang="mul" to support Latvian diacritics and any IME composition.
 */
function InputGlassCard({
  label,
  value,
  onChange,
  fontSize,
  fontWeight,
  letterSpacing,
  italic = false,
  valueColor,
  inputAriaLabel,
  marginBottom,
}: InputGlassCardProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)
  const [focused, setFocused] = useState(false)

  const textColor = valueColor ?? tokens.color.ink

  return (
    <Glass pad={16} floating sx={{ marginBottom }}>
      {/* Uppercase label: 12/700 inkSec */}
      <Box
        component="span"
        sx={{
          display: 'block',
          fontFamily: glassTypography.body,
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          lineHeight: 1,
          color: tokens.color.inkSec,
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
        aria-hidden="true"
      >
        {label}
      </Box>

      {/* Input row — value + blinking caret */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        {/* Transparent input positioned over invisible placeholder text */}
        <Box
          component="input"
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={inputAriaLabel}
          // lang="mul" signals mixed-language content — prevents browser auto-correct
          // from mangling Latvian diacritics (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž)
          lang="mul"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          sx={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
            fontFamily: glassTypography.display,
            fontSize,
            fontWeight,
            letterSpacing,
            lineHeight: 1.1,
            color: textColor,
            fontStyle: italic ? 'italic' : 'normal',
            // Ensure IME composition characters (diacritics) are not clipped
            overflow: 'visible',
            // width: 0 + flex:1 avoids pushing the caret outside container
            width: 0,
          }}
        />

        {/* Blinking caret — visible only when focused */}
        {focused && (
          <Box
            aria-hidden="true"
            sx={{
              width: '2px',
              height: `calc(${fontSize} * 1.2)`,
              backgroundColor: tokens.color.accent,
              borderRadius: '1px',
              flexShrink: 0,
              animationName: 'lg-caret-blink',
              animationDuration: '1s',
              animationTimingFunction: 'steps(2)',
              animationIterationCount: 'infinite',
              // Respect prefers-reduced-motion: no blink
              '@media (prefers-reduced-motion: reduce)': {
                animationName: 'none',
                opacity: 0.6,
              },
            }}
          />
        )}
      </Box>
    </Glass>
  )
}

// ─── Part-of-speech Chip Row ──────────────────────────────────────────────────

interface PoSChipRowProps {
  readonly selected: PartOfSpeech | null
  readonly onSelect: (pos: PartOfSpeech | null) => void
}

/**
 * Single-select chip row for part of speech.
 * Selected: accent fill + white text + shadow.
 * Unselected: Glass pad=0 floating radius=999.
 *
 * Built inline — does NOT reuse <Chip> or <FilterPill> (different semantics).
 * A11y: rendered as a radiogroup with radio buttons.
 */
function PoSChipRow({ selected, onSelect }: PoSChipRowProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const handleClick = useCallback(
    (pos: PartOfSpeech) => {
      // Toggle off if already selected; otherwise select
      onSelect(selected === pos ? null : pos)
    },
    [selected, onSelect],
  )

  return (
    <Box
      role="radiogroup"
      aria-label="Part of speech"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        px: '16px',
        paddingBottom: '4px',
      }}
    >
      {PART_OF_SPEECH_OPTIONS.map((pos) => {
        const isSelected = selected === pos

        return (
          <Box
            key={pos}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => handleClick(pos)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick(pos)
              }
            }}
            sx={
              isSelected
                ? {
                    // Selected: accent fill + white text + shadow
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    backgroundColor: tokens.color.accent,
                    color: '#ffffff',
                    fontFamily: glassTypography.body,
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '-0.1px',
                    lineHeight: 1,
                    cursor: 'pointer',
                    userSelect: 'none',
                    // Shadow per spec: 0 4px 12px rgba(0,122,255,0.3)
                    boxShadow: glassShadows.pillActive,
                    transition: 'opacity 120ms ease',
                    '&:active': { opacity: 0.85 },
                    '@media (prefers-reduced-motion: reduce)': {
                      transition: 'none',
                    },
                  }
                : {
                    // Unselected: Glass pad=0 floating radius=999
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    // Glass fill
                    backgroundColor: tokens.glass.bg,
                    backdropFilter: tokens.glass.backdropFilter,
                    WebkitBackdropFilter: tokens.glass.backdropFilter,
                    // Glass rim
                    border: `0.5px solid ${tokens.glass.border}`,
                    boxShadow: `${tokens.glass.shadow}, ${tokens.glass.inner}`,
                    fontFamily: glassTypography.body,
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '-0.1px',
                    lineHeight: 1,
                    color: tokens.color.ink,
                    transition: 'opacity 120ms ease',
                    '&:active': { opacity: 0.7 },
                    '@media (prefers-reduced-transparency: reduce)': {
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      backgroundColor: tokens.color.bg,
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                      transition: 'none',
                    },
                  }
            }
          >
            {pos}
          </Box>
        )
      })}
    </Box>
  )
}

// ─── AI Upsell Card ───────────────────────────────────────────────────────────

/**
 * Stubbed AI upsell card per AC.
 * Glass pad=14 floating strong.
 * 38×38 gradient circle (aiGradient) + white Sparkles icon.
 * Middle text: "Autofill with AI" 15/700 + "Meaning, example, pronunciation" 12/500 inkSec.
 * Right pill button: "Coming soon" — disabled (opacity 0.6, cursor not-allowed).
 *
 * NO network call, NO API key, NO spinner.
 */
function AiUpsellCard(): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box sx={{ px: '16px', pb: '24px' }}>
      <Glass pad={14} floating strong>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* 38×38 gradient circle with Sparkles icon */}
          <Box
            aria-hidden="true"
            sx={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: tokens.color.aiGradient,
              // Shadow: 0 4px 12px rgba(175,82,222,0.4) per spec
              boxShadow: '0 4px 12px rgba(175,82,222,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} color="#ffffff" strokeWidth={2} aria-hidden="true" />
          </Box>

          {/* Middle text block */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              component="p"
              sx={{
                margin: 0,
                fontFamily: glassTypography.body,
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '-0.2px',
                lineHeight: 1.2,
                color: tokens.color.ink,
              }}
            >
              Autofill with AI
            </Box>
            <Box
              component="p"
              sx={{
                margin: 0,
                marginTop: '2px',
                fontFamily: glassTypography.body,
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '-0.1px',
                lineHeight: 1.3,
                color: tokens.color.inkSec,
              }}
            >
              Meaning, example, pronunciation
            </Box>
          </Box>

          {/* Coming soon pill button — disabled, no onClick handler */}
          <Box
            component="button"
            type="button"
            disabled
            aria-label="AI autofill — coming soon"
            aria-disabled="true"
            sx={{
              // 32-tall pill button, accent fill, white text
              height: '32px',
              paddingLeft: '12px',
              paddingRight: '12px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: tokens.color.accent,
              color: '#ffffff',
              fontFamily: glassTypography.body,
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '-0.1px',
              lineHeight: 1,
              // Disabled state per AC: opacity 0.6, cursor not-allowed
              opacity: 0.6,
              cursor: 'not-allowed',
              flexShrink: 0,
              // Ensure no click events fire through pointer-events: none
              pointerEvents: 'none',
            }}
          >
            Coming soon
          </Box>
        </Box>
      </Glass>
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AddWordModal({
  open,
  onClose,
  pairId,
  fromCode,
  toCode,
}: AddWordModalProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  // Generate a stable id for the dialog title (aria-labelledby)
  const titleId = useId()

  // Form state
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech | null>(null)
  const [example, setExample] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Toast state
  const [toastOpen, setToastOpen] = useState(false)

  const { addWord } = useWords(pairId)

  // Reset form when the modal opens
  useEffect(() => {
    if (open) {
      setTerm('')
      setMeaning('')
      setPartOfSpeech(null)
      setExample('')
      setSubmitting(false)
    }
  }, [open])

  // Save enabled only when both Term and Meaning have at least 1 non-whitespace char
  const canSave = term.trim().length > 0 && meaning.trim().length > 0 && !submitting

  const handleSave = useCallback(async () => {
    if (!canSave) return

    setSubmitting(true)

    // Build notes from partOfSpeech + example (stored in notes field, which is the
    // only available free-text field in the Word model).
    // Format: "[pos] example" — easy to parse in future if needed.
    const notesParts: string[] = []
    if (partOfSpeech !== null) notesParts.push(`[${partOfSpeech}]`)
    if (example.trim()) notesParts.push(example.trim())
    const notes = notesParts.join(' ') || null

    const result = await addWord(pairId, {
      source: term.trim(),
      target: meaning.trim(),
      notes,
      tags: partOfSpeech !== null ? [partOfSpeech] : [],
    })

    setSubmitting(false)

    if (result !== null) {
      // Show toast then close
      setToastOpen(true)
      onClose()
    }
    // If result === null it was a duplicate — could add error state but
    // the AC does not specify duplicate handling for this modal. Silently no-op.
  }, [canSave, addWord, pairId, term, meaning, partOfSpeech, example, onClose])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  const handleToastClose = useCallback(() => {
    setToastOpen(false)
  }, [])

  // Labels for the Term and Meaning fields: uppercase with language code
  const termLabel = `TERM · ${fromCode.toUpperCase()}`
  const meaningLabel = `MEANING · ${toCode.toUpperCase()}`

  return (
    <>
      {/* Inject caret-blink keyframes — same animation used in TypeQuizContent.
          Promoting to a <style> tag is simpler than MUI GlobalStyles here because
          the modal is conditionally rendered. */}
      {open && <style>{CARET_BLINK_KEYFRAMES}</style>}

      <Dialog
        open={open}
        onClose={handleCancel}
        fullScreen
        aria-modal="true"
        aria-labelledby={titleId}
        // Remove the default Dialog paper background so PaperSurface wallpaper shows through
        slotProps={{
          paper: {
            sx: {
              background: 'transparent',
              boxShadow: 'none',
            },
          },
        }}
      >
        <PaperSurface sx={{ overflowY: 'auto', overflowX: 'hidden', minHeight: '100dvh' }}>
          {/* Nav row */}
          <ModalNavRow
            onCancel={handleCancel}
            onSave={() => {
              void handleSave()
            }}
            saveDisabled={!canSave}
            titleId={titleId}
          />

          {/* Scrollable content */}
          <Box
            sx={{
              // Fields container: padding 10 16 0 per spec
              padding: '10px 16px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Term field */}
            <InputGlassCard
              label={termLabel}
              value={term}
              onChange={setTerm}
              fontSize="30px"
              fontWeight={800}
              letterSpacing="-0.7px"
              inputAriaLabel={`Term in ${fromCode}`}
            />

            {/* Meaning field */}
            <InputGlassCard
              label={meaningLabel}
              value={meaning}
              onChange={setMeaning}
              fontSize="20px"
              fontWeight={500}
              letterSpacing="-0.3px"
              inputAriaLabel={`Meaning in ${toCode}`}
            />
          </Box>

          {/* Part of speech */}
          <SectionHeader>Part of speech</SectionHeader>
          <PoSChipRow selected={partOfSpeech} onSelect={setPartOfSpeech} />

          {/* Example */}
          <SectionHeader>Example</SectionHeader>
          <Box sx={{ px: '16px' }}>
            <Glass pad={16} floating>
              <Box
                component="input"
                type="text"
                value={example}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExample(e.target.value)}
                placeholder="Add an example sentence…"
                aria-label="Example sentence"
                lang="mul"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                sx={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: 0,
                  fontFamily: glassTypography.body,
                  fontSize: '16px',
                  fontWeight: 500,
                  letterSpacing: '-0.2px',
                  lineHeight: 1.4,
                  color: tokens.color.inkSoft,
                  fontStyle: 'italic',
                  '&::placeholder': {
                    color: tokens.color.inkFaint,
                    fontStyle: 'italic',
                  },
                }}
              />
            </Glass>
          </Box>

          {/* AI upsell — STUBBED, no network call */}
          <SectionHeader>AI autofill</SectionHeader>
          <AiUpsellCard />
        </PaperSurface>
      </Dialog>

      {/* Success toast — shown after save, outside the Dialog so it persists as dialog closes */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleToastClose} severity="success" sx={{ width: '100%' }}>
          Word saved!
        </Alert>
      </Snackbar>
    </>
  )
}
