/**
 * WordFormDialog — full-screen modal sheet for adding/editing a word (issue #187).
 *
 * Pattern mirrors AddWordModal:
 *   - MUI Dialog with fullScreen prop
 *   - PaperSurface as content root (carries the Liquid Glass wallpaper)
 *   - NavBar at top: "Cancel" left, title centre, "Save"/"Add word" right
 *   - Form content fills middle area with native scroll
 *   - Slide-up transition on open, slide-down on dismiss (iOS modal sheet)
 *   - Respects safe-area top + bottom insets
 *
 * The form preserves all existing functionality:
 *   - Add mode (word=null) and Edit mode (word provided)
 *   - Quick-add mode: resets form after save instead of closing
 *   - Duplicate error feedback
 *   - Tag management (add/remove)
 */

import { useState, useEffect, useCallback } from 'react'
import { Dialog, Slide, Box, Stack, Typography, Chip, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import type { TransitionProps } from '@mui/material/transitions'
import { forwardRef } from 'react'
import { useTheme } from '@mui/material/styles'
import { PaperSurface } from '@/components/primitives/PaperSurface'
import { NavBar } from '@/components/composites/NavBar'
import { Glass } from '@/components/primitives/Glass'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import type { Word } from '@/types'
import type { CreateWordInput } from '../useWords'

// ─── Slide-up transition (iOS modal sheet) ────────────────────────────────────

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

// ─── Glass text field ─────────────────────────────────────────────────────────

interface GlassFieldProps {
  readonly label: string
  readonly value: string
  readonly onChange: (v: string) => void
  readonly placeholder?: string
  readonly multiline?: boolean
  readonly rows?: number
  readonly error?: boolean
  readonly helperText?: string
  readonly inputAriaLabel: string
  readonly autoFocus?: boolean
}

/**
 * Glass-styled text input consistent with Liquid Glass aesthetic.
 * Replaces MUI TextField for inputs inside the fullScreen sheet.
 */
function GlassField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 1,
  error = false,
  helperText,
  inputAriaLabel,
  autoFocus = false,
}: GlassFieldProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Glass
      pad={14}
      floating
      sx={{
        '&:focus-within': {
          outline: `2px solid ${error ? tokens.color.red : tokens.color.accent}`,
          outlineOffset: '2px',
        },
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'block',
          fontFamily: glassTypography.body,
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: error ? tokens.color.red : tokens.color.inkSec,
          mb: '6px',
        }}
      >
        {label}
      </Box>
      <Box
        component={multiline ? 'textarea' : 'input'}
        type={multiline ? undefined : 'text'}
        rows={multiline ? rows : undefined}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        aria-label={inputAriaLabel}
        // lang="mul" supports Latvian diacritics (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž)
        lang="mul"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        sx={{
          display: 'block',
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          padding: 0,
          margin: 0,
          resize: multiline ? 'none' : undefined,
          fontFamily: glassTypography.body,
          fontSize: '17px',
          fontWeight: 400,
          letterSpacing: '-0.2px',
          lineHeight: 1.4,
          color: tokens.color.ink,
          '&::placeholder': {
            color: tokens.color.inkFaint,
          },
        }}
      />
      {helperText && (
        <Box
          component="span"
          sx={{
            display: 'block',
            mt: '6px',
            fontFamily: glassTypography.body,
            fontSize: '13px',
            fontWeight: 400,
            color: error ? tokens.color.red : tokens.color.inkSec,
          }}
        >
          {helperText}
        </Box>
      )}
    </Glass>
  )
}

// ─── iOS-style tag input ──────────────────────────────────────────────────────

interface TagInputProps {
  readonly tags: readonly string[]
  readonly tagInput: string
  readonly onTagInputChange: (v: string) => void
  readonly onAddTag: () => void
  readonly onRemoveTag: (tag: string) => void
  readonly onKeyDown: (e: React.KeyboardEvent) => void
}

function TagInput({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onKeyDown,
}: TagInputProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Glass pad={14} floating>
      <Box
        component="span"
        sx={{
          display: 'block',
          fontFamily: glassTypography.body,
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: tokens.color.inkSec,
          mb: '6px',
        }}
      >
        Tags (optional)
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Box
          component="input"
          type="text"
          value={tagInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTagInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Press Enter or comma to add a tag"
          aria-label="Tags"
          lang="mul"
          autoComplete="off"
          sx={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
            fontFamily: glassTypography.body,
            fontSize: '17px',
            fontWeight: 400,
            letterSpacing: '-0.2px',
            lineHeight: 1.4,
            color: tokens.color.ink,
            '&::placeholder': {
              color: tokens.color.inkFaint,
              fontSize: '14px',
            },
          }}
        />
        <IconButton
          aria-label="Add tag"
          onClick={onAddTag}
          size="small"
          disabled={!tagInput.trim()}
          sx={{ color: tokens.color.accent, flexShrink: 0 }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
      {tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px', mt: '10px' }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onDelete={() => onRemoveTag(tag)}
              aria-label={`Remove tag ${tag}`}
              sx={{
                fontFamily: glassTypography.body,
                fontSize: '13px',
                backgroundColor: tokens.color.accentSoft,
                color: tokens.color.accentText,
                '& .MuiChip-deleteIcon': {
                  color: tokens.color.accent,
                },
              }}
            />
          ))}
        </Box>
      )}
    </Glass>
  )
}

// ─── Nav Row ──────────────────────────────────────────────────────────────────

interface FormNavBarProps {
  readonly isEdit: boolean
  readonly canSubmit: boolean
  readonly submitting: boolean
  readonly onCancel: () => void
  readonly onSubmit: () => void
}

/**
 * iOS-style nav row: Cancel (left) | Title (centre) | Save/Add word (right).
 * Uses the existing NavBar component with leading/trailing slots.
 */
function FormNavBar({
  isEdit,
  canSubmit,
  submitting,
  onCancel,
  onSubmit,
}: FormNavBarProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const navBtnBase = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
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
    <NavBar
      title={isEdit ? 'Edit word' : 'Add word'}
      leading={
        <Box
          component="button"
          type="button"
          onClick={onCancel}
          aria-label="Cancel and close"
          sx={{
            ...navBtnBase,
            fontWeight: 400,
            color: tokens.color.accent,
          }}
        >
          Cancel
        </Box>
      }
      trailing={
        <Box
          component="button"
          type="button"
          onClick={canSubmit && !submitting ? onSubmit : undefined}
          disabled={!canSubmit || submitting}
          aria-label={isEdit ? 'Save changes' : 'Add word'}
          sx={{
            ...navBtnBase,
            fontWeight: 700,
            color: canSubmit && !submitting ? tokens.color.accent : tokens.color.inkFaint,
            cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
            opacity: canSubmit && !submitting ? 1 : 0.5,
          }}
        >
          {submitting ? 'Saving…' : isEdit ? 'Save' : 'Add word'}
        </Box>
      }
    />
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WordFormDialogProps {
  readonly open: boolean
  /** If provided, the dialog is in edit mode. If null, add mode. */
  readonly word: Word | null
  /** If true, after saving the form resets for quick-add of another word. */
  readonly quickAddMode?: boolean
  readonly onClose: () => void
  readonly onSubmit: (input: CreateWordInput) => Promise<boolean>
}

const EMPTY_FORM = {
  source: '',
  target: '',
  notes: '',
  tagInput: '',
  tags: [] as string[],
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Full-screen modal sheet for adding a new word or editing an existing one.
 * Mirrors AddWordModal pattern: fullScreen Dialog + PaperSurface + NavBar.
 * Slide-up transition on open, slide-down on dismiss (iOS modal sheet).
 */
export function WordFormDialog({
  open,
  word,
  quickAddMode = false,
  onClose,
  onSubmit,
}: WordFormDialogProps) {
  const isEdit = word !== null
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [notes, setNotes] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [duplicateError, setDuplicateError] = useState(false)

  // Populate form when editing an existing word or when dialog opens.
  useEffect(() => {
    if (open) {
      if (word) {
        setSource(word.source)
        setTarget(word.target)
        setNotes(word.notes ?? '')
        setTags([...word.tags])
      } else {
        setSource(EMPTY_FORM.source)
        setTarget(EMPTY_FORM.target)
        setNotes(EMPTY_FORM.notes)
        setTagInput(EMPTY_FORM.tagInput)
        setTags(EMPTY_FORM.tags)
      }
      setDuplicateError(false)
    }
  }, [open, word])

  const resetForm = useCallback(() => {
    setSource('')
    setTarget('')
    setNotes('')
    setTagInput('')
    setTags([])
    setDuplicateError(false)
  }, [])

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput('')
  }, [tagInput, tags])

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        addTag()
      }
    },
    [addTag],
  )

  const canSubmit = source.trim().length > 0 && target.trim().length > 0 && !submitting

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    setSubmitting(true)
    setDuplicateError(false)

    const success = await onSubmit({
      source: source.trim(),
      target: target.trim(),
      notes: notes.trim() || null,
      tags,
    })

    setSubmitting(false)

    if (!success) {
      setDuplicateError(true)
      return
    }

    if (quickAddMode && !isEdit) {
      resetForm()
    } else {
      onClose()
    }
  }, [canSubmit, onSubmit, source, target, notes, tags, quickAddMode, isEdit, onClose, resetForm])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      aria-modal="true"
      aria-label={isEdit ? 'Edit word' : 'Add word'}
      slots={{ transition: SlideUpTransition }}
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
        <FormNavBar
          isEdit={isEdit}
          canSubmit={canSubmit}
          submitting={submitting}
          onCancel={onClose}
          onSubmit={() => {
            void handleSubmit()
          }}
        />

        <Box sx={{ px: '16px', pb: '32px' }}>
          <Stack spacing="12px">
            <GlassField
              label="Source word"
              value={source}
              onChange={setSource}
              inputAriaLabel="Source word"
              error={duplicateError}
              autoFocus
            />

            <GlassField
              label="Target word"
              value={target}
              onChange={setTarget}
              inputAriaLabel="Target word"
              error={duplicateError}
              helperText={duplicateError ? 'This word already exists in the list.' : undefined}
            />

            <GlassField
              label="Notes (optional)"
              value={notes}
              onChange={setNotes}
              placeholder="Example sentence, context, memory hint…"
              multiline
              rows={3}
              inputAriaLabel="Notes"
            />

            <TagInput
              tags={tags}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onKeyDown={handleTagKeyDown}
            />

            {quickAddMode && !isEdit && (
              <Typography
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: '13px',
                  fontWeight: 400,
                  color: tokens.color.inkSec,
                  px: '4px',
                }}
              >
                Quick-add mode: form resets after each save so you can add multiple words.
              </Typography>
            )}
          </Stack>
        </Box>
      </PaperSurface>
    </Dialog>
  )
}
