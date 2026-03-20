import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
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
import type { Word, LanguagePair } from '@/types'
import { parseImportText, findDuplicateLineNumbers } from '@/utils/importParser'
import type { ParsedWordRow, ParseErrorRow } from '@/utils/importParser'

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

/**
 * Multi-step dialog for bulk importing words by pasting CSV/TSV/semicolon text.
 *
 * Step 1 (input):   Textarea for pasting raw text.
 * Step 2 (preview): Table showing parsed rows with duplicate highlights; user can deselect rows.
 * Step 3 (done):    Import summary.
 */
export function ImportWordsDialog({
  open,
  activePair,
  existingWords,
  onClose,
  onImport,
}: ImportWordsDialogProps) {
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
    // Pre-deselect all duplicate rows so the user doesn't accidentally re-import them.
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

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const canPreview = rows.length > 0

  return (
    <Dialog
      open={open}
      onClose={step === 'done' || step === 'input' ? handleClose : undefined}
      fullWidth
      maxWidth="md"
      aria-labelledby="import-dialog-title"
    >
      <DialogTitle id="import-dialog-title">Import words</DialogTitle>

      <DialogContent dividers>
        {step === 'input' && (
          <StepInput
            rawText={rawText}
            onRawTextChange={setRawText}
            activePair={activePair}
            previewRowCount={rows.length}
            errorCount={errors.length}
          />
        )}

        {step === 'preview' && (
          <StepPreview
            rows={rows}
            errors={errors}
            duplicateLineNumbers={duplicateLineNumbers}
            deselectedLineNumbers={deselectedLineNumbers}
            onToggleRow={handleToggleRow}
          />
        )}

        {step === 'done' && summary !== null && <StepDone summary={summary} />}
      </DialogContent>

      <DialogActions>
        {step === 'input' && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleParseAndPreview} disabled={!canPreview}>
              Preview ({rows.length})
            </Button>
          </>
        )}

        {step === 'preview' && (
          <>
            <Button onClick={handleBack} disabled={importing}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmImport}
              disabled={importing || selectedRows.length === 0}
              startIcon={importing ? <CircularProgress size={16} /> : undefined}
            >
              {importing
                ? 'Importing…'
                : `Import ${selectedRows.length} word${selectedRows.length !== 1 ? 's' : ''}`}
            </Button>
          </>
        )}

        {step === 'done' && (
          <Button variant="contained" onClick={handleClose}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Sub-components for each step
// ---------------------------------------------------------------------------

interface StepInputProps {
  readonly rawText: string
  readonly onRawTextChange: (text: string) => void
  readonly activePair: LanguagePair
  readonly previewRowCount: number
  readonly errorCount: number
}

function StepInput({
  rawText,
  onRawTextChange,
  activePair,
  previewRowCount,
  errorCount,
}: StepInputProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Paste words for{' '}
        <strong>
          {activePair.sourceLang} → {activePair.targetLang}
        </strong>
        . Supported formats: <code>source,target</code>, <code>source{'\t'}target</code>, or{' '}
        <code>source;target</code>. An optional third column is treated as notes. The delimiter is
        auto-detected.
      </Typography>

      <TextField
        multiline
        minRows={8}
        maxRows={20}
        fullWidth
        value={rawText}
        onChange={(e) => onRawTextChange(e.target.value)}
        placeholder={`hello,world\ncat\tKatze\nbonjour;hello,a French greeting`}
        inputProps={{ 'aria-label': 'Paste words here', lang: 'mul', spellCheck: false }}
        sx={{ fontFamily: 'monospace' }}
      />

      {rawText.trim().length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
}

function StepPreview({
  rows,
  errors,
  duplicateLineNumbers,
  deselectedLineNumbers,
  onToggleRow,
}: StepPreviewProps) {
  const selectedCount = rows.filter((r) => !deselectedLineNumbers.has(r.lineNumber)).length
  const duplicateCount = rows.filter((r) => duplicateLineNumbers.has(r.lineNumber)).length

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2">
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
      </Box>

      <TableContainer sx={{ maxHeight: 360, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small" stickyHeader aria-label="Import preview">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Source</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Status</TableCell>
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
                  <TableCell>{row.source}</TableCell>
                  <TableCell>{row.target}</TableCell>
                  <TableCell
                    sx={{ color: 'text.secondary', fontStyle: row.notes ? 'normal' : 'italic' }}
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
            <Typography variant="body2" fontWeight={600} gutterBottom>
              {errors.length} line{errors.length !== 1 ? 's' : ''} could not be parsed and will be
              skipped:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: 120, overflowY: 'auto' }}>
              {errors.map((err) => (
                <li key={err.lineNumber}>
                  <Typography variant="caption">
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
}

function StepDone({ summary }: StepDoneProps) {
  return (
    <Stack spacing={2}>
      <Alert severity="success">Import complete.</Alert>
      <Box component="ul" sx={{ m: 0, pl: 3 }}>
        <li>
          <Typography variant="body2">
            Added <strong>{summary.added}</strong> word{summary.added !== 1 ? 's' : ''}
          </Typography>
        </li>
        {summary.skippedDuplicates > 0 && (
          <li>
            <Typography variant="body2">
              Skipped <strong>{summary.skippedDuplicates}</strong> duplicate
              {summary.skippedDuplicates !== 1 ? 's' : ''}
            </Typography>
          </li>
        )}
        {summary.errors > 0 && (
          <li>
            <Typography variant="body2">
              <strong>{summary.errors}</strong> error{summary.errors !== 1 ? 's' : ''} (unparseable
              lines)
            </Typography>
          </li>
        )}
      </Box>
    </Stack>
  )
}
