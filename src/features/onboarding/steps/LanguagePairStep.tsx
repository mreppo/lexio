import { useState, useCallback } from 'react'
import { Box, Typography, Button, TextField, Autocomplete, Stack, Alert, Chip } from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import { LANGUAGE_PRESETS, DEFAULT_PAIR_PRESET } from '@/features/language-pairs'
import type { LanguagePreset, CreatePairInput } from '@/features/language-pairs'
import type { LanguagePair } from '@/types'

export interface LanguagePairStepProps {
  readonly onPairCreated: (pair: LanguagePair) => void
  readonly onCreatePair: (input: CreatePairInput) => Promise<LanguagePair>
}

interface FormState {
  sourceLang: string
  sourceCode: string
  targetLang: string
  targetCode: string
}

const DEFAULT_FORM: FormState = {
  sourceLang: DEFAULT_PAIR_PRESET.sourceLang,
  sourceCode: DEFAULT_PAIR_PRESET.sourceCode,
  targetLang: DEFAULT_PAIR_PRESET.targetLang,
  targetCode: DEFAULT_PAIR_PRESET.targetCode,
}

/** Popular preset pairs offered as quick-select chips. */
const POPULAR_PRESETS = [
  { label: 'EN → LV', source: 'English', sourceCode: 'en', target: 'Latvian', targetCode: 'lv' },
  { label: 'EN → DE', source: 'English', sourceCode: 'en', target: 'German', targetCode: 'de' },
  { label: 'EN → ES', source: 'English', sourceCode: 'en', target: 'Spanish', targetCode: 'es' },
  { label: 'EN → FR', source: 'English', sourceCode: 'en', target: 'French', targetCode: 'fr' },
] as const

/**
 * Step 2 of the onboarding flow.
 * Lets the user select a language pair via quick-select chips or a custom form.
 * Pre-fills with the EN-LV default suggestion from the product spec.
 */
export function LanguagePairStep({ onPairCreated, onCreatePair }: LanguagePairStepProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePresetChipClick = useCallback(
    (preset: (typeof POPULAR_PRESETS)[number]) => () => {
      setForm({
        sourceLang: preset.source,
        sourceCode: preset.sourceCode,
        targetLang: preset.target,
        targetCode: preset.targetCode,
      })
      setError(null)
    },
    [],
  )

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
      setError('Please fill in all fields to continue.')
      return
    }

    if (sourceLang.trim() === targetLang.trim() && sourceCode.trim() === targetCode.trim()) {
      setError('Source and target languages must be different.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const pair = await onCreatePair({
        sourceLang: sourceLang.trim(),
        sourceCode: sourceCode.trim().toLowerCase(),
        targetLang: targetLang.trim(),
        targetCode: targetCode.trim().toLowerCase(),
      })
      onPairCreated(pair)
    } catch {
      setError('Failed to create language pair. Please try again.')
      setSubmitting(false)
    }
  }, [form, onCreatePair, onPairCreated])

  const sourcePresetValue = LANGUAGE_PRESETS.find((p) => p.name === form.sourceLang) ?? null
  const targetPresetValue = LANGUAGE_PRESETS.find((p) => p.name === form.targetLang) ?? null

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        px: 3,
        py: 4,
        maxWidth: 480,
        mx: 'auto',
        width: '100%',
      }}
    >
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <TranslateIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" gutterBottom>
          Create your first language pair
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose what you already know and what you want to learn.
        </Typography>
      </Box>

      {/* Quick-select chips */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Popular choices
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {POPULAR_PRESETS.map((preset) => {
            const isSelected =
              form.sourceLang === preset.source && form.targetLang === preset.target
            return (
              <Chip
                key={preset.label}
                label={preset.label}
                onClick={handlePresetChipClick(preset)}
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{ mb: 0.5 }}
              />
            )
          })}
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Source language — the one you already know
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
              inputProps={{ ...params.inputProps, lang: 'und' }}
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
          helperText="BCP-47 code (auto-filled from preset)"
        />

        <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
          Target language — the one you want to learn
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
              inputProps={{ ...params.inputProps, lang: 'und' }}
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
          helperText="BCP-47 code (auto-filled from preset)"
        />
      </Stack>

      <Button
        variant="contained"
        size="large"
        onClick={() => {
          void handleSubmit()
        }}
        disabled={submitting}
        sx={{ borderRadius: 2, py: 1.5 }}
      >
        {submitting ? 'Creating...' : 'Continue'}
      </Button>
    </Box>
  )
}
