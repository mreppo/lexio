import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Stack,
  Typography,
  Alert,
} from '@mui/material'
import { LANGUAGE_PRESETS, DEFAULT_PAIR_PRESET, type LanguagePreset } from '../constants'
import type { CreatePairInput } from '../useLanguagePairs'

export interface CreatePairDialogProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSubmit: (input: CreatePairInput) => Promise<void>
  /** Whether to pre-fill with the EN-LV default (used on first launch). */
  readonly suggestDefault?: boolean
}

interface FormState {
  sourceLang: string
  sourceCode: string
  targetLang: string
  targetCode: string
}

const EMPTY_FORM: FormState = {
  sourceLang: '',
  sourceCode: '',
  targetLang: '',
  targetCode: '',
}

/**
 * Modal dialog for creating a new language pair.
 * Provides autocomplete from common presets and allows fully custom entries.
 */
export function CreatePairDialog({
  open,
  onClose,
  onSubmit,
  suggestDefault = false,
}: CreatePairDialogProps) {
  const [form, setForm] = useState<FormState>(() =>
    suggestDefault ? { ...DEFAULT_PAIR_PRESET } : EMPTY_FORM,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens/closes.
  const handleClose = useCallback(() => {
    setForm(suggestDefault ? { ...DEFAULT_PAIR_PRESET } : EMPTY_FORM)
    setError(null)
    setSubmitting(false)
    onClose()
  }, [onClose, suggestDefault])

  const handleSourcePresetChange = useCallback(
    (_: React.SyntheticEvent, value: LanguagePreset | string | null) => {
      if (typeof value === 'string') {
        setForm((prev) => ({ ...prev, sourceLang: value, sourceCode: '' }))
      } else if (value) {
        setForm((prev) => ({ ...prev, sourceLang: value.name, sourceCode: value.code }))
      } else {
        setForm((prev) => ({ ...prev, sourceLang: '', sourceCode: '' }))
      }
    },
    [],
  )

  const handleTargetPresetChange = useCallback(
    (_: React.SyntheticEvent, value: LanguagePreset | string | null) => {
      if (typeof value === 'string') {
        setForm((prev) => ({ ...prev, targetLang: value, targetCode: '' }))
      } else if (value) {
        setForm((prev) => ({ ...prev, targetLang: value.name, targetCode: value.code }))
      } else {
        setForm((prev) => ({ ...prev, targetLang: '', targetCode: '' }))
      }
    },
    [],
  )

  const handleSubmit = useCallback(async () => {
    const { sourceLang, sourceCode, targetLang, targetCode } = form

    if (!sourceLang.trim() || !sourceCode.trim() || !targetLang.trim() || !targetCode.trim()) {
      setError('All fields are required.')
      return
    }

    if (sourceLang.trim() === targetLang.trim() && sourceCode.trim() === targetCode.trim()) {
      setError('Source and target languages must be different.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await onSubmit({
        sourceLang: sourceLang.trim(),
        sourceCode: sourceCode.trim().toLowerCase(),
        targetLang: targetLang.trim(),
        targetCode: targetCode.trim().toLowerCase(),
      })
      handleClose()
    } catch {
      setError('Failed to create language pair. Please try again.')
      setSubmitting(false)
    }
  }, [form, onSubmit, handleClose])

  const sourcePresetValue = LANGUAGE_PRESETS.find((p) => p.name === form.sourceLang) ?? null
  const targetPresetValue = LANGUAGE_PRESETS.find((p) => p.name === form.targetLang) ?? null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Typography variant="h6" component="span" fontWeight={700}>
          Add language pair
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Source language (the one you already know)
            </Typography>

            <Autocomplete<LanguagePreset, false, false, true>
              options={[...LANGUAGE_PRESETS]}
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : `${option.name} (${option.code})`
              }
              value={sourcePresetValue}
              onChange={handleSourcePresetChange}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Source language"
                  placeholder="e.g. English"
                  inputProps={{
                    ...params.inputProps,
                    // Support Latvian diacritics and all Unicode input.
                    lang: 'und',
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.code === value.code}
            />

            <TextField
              label="Language code"
              placeholder="e.g. en"
              value={form.sourceCode}
              onChange={(e) => setForm((prev) => ({ ...prev, sourceCode: e.target.value }))}
              inputProps={{ maxLength: 10 }}
              helperText="BCP-47 code (filled automatically when selecting a preset)"
            />
          </Stack>

          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Target language (the one you want to learn)
            </Typography>

            <Autocomplete<LanguagePreset, false, false, true>
              options={[...LANGUAGE_PRESETS]}
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : `${option.name} (${option.code})`
              }
              value={targetPresetValue}
              onChange={handleTargetPresetChange}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Target language"
                  placeholder="e.g. Latvian"
                  inputProps={{
                    ...params.inputProps,
                    lang: 'und',
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.code === value.code}
            />

            <TextField
              label="Language code"
              placeholder="e.g. lv"
              value={form.targetCode}
              onChange={(e) => setForm((prev) => ({ ...prev, targetCode: e.target.value }))}
              inputProps={{ maxLength: 10 }}
              helperText="BCP-47 code (filled automatically when selecting a preset)"
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create pair'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
