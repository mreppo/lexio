/**
 * ImportWordsDialog — full-screen modal sheet for bulk importing words (issue #187).
 *
 * Pattern mirrors AddWordModal:
 *   - MUI Dialog with fullScreen prop
 *   - PaperSurface as content root (Liquid Glass wallpaper)
 *   - NavBar at top: "Cancel" left, step title centre, action button right
 *   - Multi-step content fills middle area with native scroll
 *   - Slide-up transition on open, slide-down on dismiss (iOS modal sheet)
 *
 * Multi-step flow preserved:
 *   Step 1 (input):   Textarea for pasting raw text.
 *   Step 2 (preview): Table showing parsed rows with duplicate highlights; user can deselect rows.
 *   Step 3 (done):    Import summary.
 */

import { useState, useMemo, useCallback, useEffect, forwardRef } from 'react'
import {
  Dialog,
  Slide,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Checkbox,
  Chip,
  Alert,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import type { TransitionProps } from '@mui/material/transitions'
import { useTheme } from '@mui/material/styles'
import { PaperSurface } from '@/components/primitives/PaperSurface'
import { NavBar } from '@/components/composites/NavBar'
import { Glass } from '@/components/primitives/Glass'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import type { Word, LanguagePair } from '@/types'
import { parseImportText, findDuplicateLineNumbers } from '@/utils/importParser'
import type { ParsedWordRow, ParseErrorRow } from '@/utils/importParser'

// ─── Slide-up transition (iOS modal sheet) ────────────────────────────────────

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportWordsDialogProps {
  readonly open: boolean
  readonly activePair: LanguagePair
  readonly existingWords: readonly Word[]
  readonly onClose: () => void
  /** Called with the rows the user confirmed to import. Returns import summary counts. */
  readonly onImport: (rows: readonly ParsedWordRow[]) => Promise<ImportSummary>
}

export interface ImportSummary {
  readonly added: number
  readonly skippedDuplicates: number
  readonly errors: number
}

type Step = 'input' | 'preview' | 'done'

// ─── Nav button helper ────────────────────────────────────────────────────────

interface NavActionButtonProps {
  readonly label: string
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly destructive?: boolean
  readonly position: 'left' | 'right'
}

function NavActionButton({
  label,
  onClick,
  disabled = false,
  destructive = false,
  position,
}: NavActionButtonProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box
      component="button"
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={label}
      sx={{
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '4px 0',
        fontFamily: glassTypography.body,
        fontSize: '17px',
        letterSpacing: '-0.3px',
        lineHeight: 1,
        fontWeight: position === 'right' ? 700 : 400,
        color: disabled
          ? tokens.color.inkFaint
          : destructive
            ? tokens.color.red
            : tokens.color.accent,
        opacity: disabled ? 0.5 : 1,
        WebkitTapHighlightColor: 'transparent',
        transition: 'opacity 120ms ease',
        '&:active': { opacity: disabled ? 0.5 : 0.7 },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      {label}
    </Box>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * Full-screen modal sheet for bulk importing words by pasting CSV/TSV/semicolon text.
 * Multi-step (input → preview → done) flow preserved from original implementation.
 */
export function ImportWordsDialog({
  open,
  activePair,
  existingWords,
  onClose,
  onImport,
}: ImportWordsDialogProps) {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const [step, setStep] = useState<Step>('input')
  const [rawText, setRawText] = useState('')
  const [deselectedLineNumbers, setDeselectedLineNumbers] = useState<Set<number>>(new Set())
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [importing, setImporting] = useState(false)

  // Reset all state each time the dialog opens so re-opening starts fresh.
  useEffect(() => {
    if (open) {
      setStep('input')
      setRawText('')
      setDeselectedLineNumbers(new Set())
      setSummary(null)
      setImporting(false)
    }
  }, [open])

  const { rows, errors } = useMemo(() => parseImportText(rawText), [rawText])

  const duplicateLineNumbers = useMemo(
    () => findDuplicateLineNumbers(rows, existingWords),
    [rows, existingWords],
  )

  // Rows the user has NOT deselected.
  const selectedRows = useMemo(
    () => rows.filter((r) => !deselectedLineNumbers.has(r.lineNumber)),
    [rows, deselectedLineNumbers],
  )

  const handleToggleRow = useCallback((lineNumber: number) => {
    setDeselectedLineNumbers((prev) => {
      const next = new Set(prev)
      if (next.has(lineNumber)) {
        next.delete(lineNumber)
      } else {
        next.add(lineNumber)
      }
      return next
    })
  }, [])

  const handleParseAndPreview = useCallback(() => {
    setDeselectedLineNumbers(new Set(duplicateLineNumbers))
    setStep('preview')
  }, [duplicateLineNumbers])

  const handleBack = useCallback(() => {
    setStep('input')
  }, [])

  const handleConfirmImport = useCallback(async () => {
    setImporting(true)
    const result = await onImport(selectedRows)
    setSummary(result)
    setImporting(false)
    setStep('done')
  }, [onImport, selectedRows])

  const canPreview = rows.length > 0

  // ── Step titles and actions ───────────────────────────────────────────────

  const stepTitle =
    step === 'input' ? 'Import words' : step === 'preview' ? 'Preview' : 'Import complete'

  const leadingAction =
    step === 'preview' ? (
      <NavActionButton label="Back" onClick={handleBack} disabled={importing} position="left" />
    ) : step === 'done' ? null : (
      <NavActionButton label="Cancel" onClick={onClose} position="left" />
    )

  const trailingAction =
    step === 'input' ? (
      <NavActionButton
        label={`Preview (${rows.length})`}
        onClick={handleParseAndPreview}
        disabled={!canPreview}
        position="right"
      />
    ) : step === 'preview' ? (
      <NavActionButton
        label={
          importing
            ? 'Importing…'
            : `Import ${selectedRows.length} word${selectedRows.length !== 1 ? 's' : ''}`
        }
        onClick={() => {
          void handleConfirmImport()
        }}
        disabled={importing || selectedRows.length === 0}
        position="right"
      />
    ) : (
      <NavActionButton label="Done" onClick={onClose} position="right" />
    )

  return (
    <Dialog
      open={open}
      onClose={step === 'done' || step === 'input' ? onClose : undefined}
      fullScreen
      aria-modal="true"
      aria-label="Import words"
      TransitionComponent={SlideUpTransition}
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
        <NavBar title={stepTitle} leading={leadingAction} trailing={trailingAction} />

        <Box sx={{ px: '16px', pb: '32px' }}>
          {step === 'input' && (
            <StepInput
              rawText={rawText}
              onRawTextChange={setRawText}
              activePair={activePair}
              previewRowCount={rows.length}
              errorCount={errors.length}
              tokens={tokens}
            />
          )}

          {step === 'preview' && (
            <StepPreview
              rows={rows}
              errors={errors}
              duplicateLineNumbers={duplicateLineNumbers}
              deselectedLineNumbers={deselectedLineNumbers}
              onToggleRow={handleToggleRow}
              importing={importing}
              tokens={tokens}
            />
          )}

          {step === 'done' && summary !== null && <StepDone summary={summary} tokens={tokens} />}
        </Box>
      </PaperSurface>
    </Dialog>
  )
}

// ─── Step sub-components ──────────────────────────────────────────────────────

interface GlassColorTokensRef {
  readonly color: {
    readonly ink: string
    readonly inkSec: string
    readonly inkFaint: string
    readonly accentSoft: string
    readonly accentText: string
    readonly accent: string
    readonly ok: string
    readonly warn: string
    readonly red: string
    readonly rule2: string
    readonly bg: string
  }
  readonly glass: {
    readonly bg: string
    readonly bgStrong: string
    readonly border: string
    readonly inner: string
    readonly shadow: string
    readonly backdropFilter: string
  }
}

interface StepInputProps {
  readonly rawText: string
  readonly onRawTextChange: (text: string) => void
  readonly activePair: LanguagePair
  readonly previewRowCount: number
  readonly errorCount: number
  readonly tokens: GlassColorTokensRef
}

function StepInput({
  rawText,
  onRawTextChange,
  activePair,
  previewRowCount,
  errorCount,
  tokens,
}: StepInputProps) {
  return (
    <Stack spacing="12px">
      <Typography
        sx={{
          fontFamily: glassTypography.body,
          fontSize: '14px',
          fontWeight: 400,
          color: tokens.color.inkSec,
          lineHeight: 1.5,
        }}
      >
        Paste words for{' '}
        <Box component="strong" sx={{ color: tokens.color.ink }}>
          {activePair.sourceLang} → {activePair.targetLang}
        </Box>
        . Supported formats: <code>source,target</code>, <code>source{'\t'}target</code>, or{' '}
        <code>source;target</code>. An optional third column is treated as notes.
      </Typography>

      <Glass
        pad={14}
        floating
        sx={{
          '&:focus-within': {
            outline: `2px solid ${tokens.color.accent}`,
            outlineOffset: '2px',
          },
        }}
      >
        <Box
          component="textarea"
          value={rawText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onRawTextChange(e.target.value)}
          rows={10}
          placeholder={`hello,world\ncat\tKatze\nbonjour;hello,a French greeting`}
          aria-label="Paste words here"
          lang="mul"
          spellCheck={false}
          sx={{
            display: 'block',
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            resize: 'vertical',
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: 1.5,
            color: tokens.color.ink,
            minHeight: '180px',
            '&::placeholder': {
              color: tokens.color.inkFaint,
            },
          }}
        />
      </Glass>

      {rawText.trim().length > 0 && (
        <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {previewRowCount > 0 && (
            <Chip
              label={`${previewRowCount} word${previewRowCount !== 1 ? 's' : ''} detected`}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {errorCount > 0 && (
            <Chip
              label={`${errorCount} line${errorCount !== 1 ? 's' : ''} could not be parsed`}
              size="small"
              color="warning"
              variant="outlined"
              icon={<WarningAmberIcon />}
            />
          )}
        </Box>
      )}
    </Stack>
  )
}

interface StepPreviewProps {
  readonly rows: readonly ParsedWordRow[]
  readonly errors: readonly ParseErrorRow[]
  readonly duplicateLineNumbers: ReadonlySet<number>
  readonly deselectedLineNumbers: ReadonlySet<number>
  readonly onToggleRow: (lineNumber: number) => void
  readonly importing: boolean
  readonly tokens: GlassColorTokensRef
}

function StepPreview({
  rows,
  errors,
  duplicateLineNumbers,
  deselectedLineNumbers,
  onToggleRow,
  importing,
  tokens,
}: StepPreviewProps) {
  const selectedCount = rows.filter((r) => !deselectedLineNumbers.has(r.lineNumber)).length
  const duplicateCount = rows.filter((r) => duplicateLineNumbers.has(r.lineNumber)).length

  return (
    <Stack spacing="12px">
      <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography
          sx={{
            fontFamily: glassTypography.body,
            fontSize: '14px',
            fontWeight: 400,
            color: tokens.color.inkSec,
          }}
        >
          {selectedCount} of {rows.length} row{rows.length !== 1 ? 's' : ''} selected for import.
        </Typography>
        {duplicateCount > 0 && (
          <Chip
            label={`${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} detected`}
            size="small"
            color="warning"
            variant="outlined"
          />
        )}
        {importing && <CircularProgress size={16} />}
      </Box>

      <TableContainer
        sx={{
          maxHeight: 360,
          border: `0.5px solid ${tokens.color.rule2}`,
          borderRadius: '12px',
          backgroundColor: tokens.glass.bg,
          backdropFilter: tokens.glass.backdropFilter,
          WebkitBackdropFilter: tokens.glass.backdropFilter,
        }}
      >
        <Table size="small" stickyHeader aria-label="Import preview">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell sx={{ fontFamily: glassTypography.body }}>Source</TableCell>
              <TableCell sx={{ fontFamily: glassTypography.body }}>Target</TableCell>
              <TableCell sx={{ fontFamily: glassTypography.body }}>Notes</TableCell>
              <TableCell sx={{ fontFamily: glassTypography.body }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isDuplicate = duplicateLineNumbers.has(row.lineNumber)
              const isSelected = !deselectedLineNumbers.has(row.lineNumber)

              return (
                <TableRow
                  key={row.lineNumber}
                  selected={isSelected}
                  sx={{ opacity: isSelected ? 1 : 0.4 }}
                  hover
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleRow(row.lineNumber)}
                      size="small"
                      inputProps={{ 'aria-label': `Toggle row ${row.lineNumber}` }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: glassTypography.body }}>{row.source}</TableCell>
                  <TableCell sx={{ fontFamily: glassTypography.body }}>{row.target}</TableCell>
                  <TableCell
                    sx={{
                      color: tokens.color.inkSec,
                      fontStyle: row.notes ? 'normal' : 'italic',
                      fontFamily: glassTypography.body,
                    }}
                  >
                    {row.notes ?? '—'}
                  </TableCell>
                  <TableCell>
                    {isDuplicate && (
                      <Chip label="Duplicate" size="small" color="warning" variant="outlined" />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {errors.length > 0 && (
        <>
          <Divider />
          <Alert severity="warning" icon={<WarningAmberIcon />}>
            <Typography
              sx={{
                fontFamily: glassTypography.body,
                fontSize: '14px',
                fontWeight: 600,
              }}
              gutterBottom
            >
              {errors.length} line{errors.length !== 1 ? 's' : ''} could not be parsed and will be
              skipped:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: 120, overflowY: 'auto' }}>
              {errors.map((err) => (
                <li key={err.lineNumber}>
                  <Typography sx={{ fontFamily: glassTypography.body, fontSize: '13px' }}>
                    Line {err.lineNumber}: <code>{err.raw}</code> — {err.reason}
                  </Typography>
                </li>
              ))}
            </Box>
          </Alert>
        </>
      )}
    </Stack>
  )
}

interface StepDoneProps {
  readonly summary: ImportSummary
  readonly tokens: GlassColorTokensRef
}

function StepDone({ summary, tokens }: StepDoneProps) {
  return (
    <Stack spacing="12px">
      <Alert severity="success">Import complete.</Alert>
      <Glass pad={16} floating>
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          <li>
            <Typography
              sx={{
                fontFamily: glassTypography.body,
                fontSize: '15px',
                color: tokens.color.ink,
              }}
            >
              Added <Box component="strong">{summary.added}</Box> word
              {summary.added !== 1 ? 's' : ''}
            </Typography>
          </li>
          {summary.skippedDuplicates > 0 && (
            <li>
              <Typography
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: '15px',
                  color: tokens.color.inkSec,
                }}
              >
                Skipped <Box component="strong">{summary.skippedDuplicates}</Box> duplicate
                {summary.skippedDuplicates !== 1 ? 's' : ''}
              </Typography>
            </li>
          )}
          {summary.errors > 0 && (
            <li>
              <Typography
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: '15px',
                  color: tokens.color.red,
                }}
              >
                <Box component="strong">{summary.errors}</Box> error
                {summary.errors !== 1 ? 's' : ''} (unparseable lines)
              </Typography>
            </li>
          )}
        </Box>
      </Glass>
    </Stack>
  )
}
