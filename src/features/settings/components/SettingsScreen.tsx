/**
 * SettingsScreen - placeholder for the settings/preferences feature.
 *
 * Theme mode toggle is accessible here. The full settings panel
 * (daily goal, quiz mode, data export/import, reset) will be built
 * in a future issue.
 */

import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import type { SelectChangeEvent } from '@mui/material'
import type { ThemePreference } from '@/types'

export interface SettingsScreenProps {
  /** The user's current theme preference. */
  readonly themePreference: ThemePreference
  /** Called when the user changes the theme preference. */
  readonly onThemeChange: (preference: ThemePreference) => void
}

export function SettingsScreen({ themePreference, onThemeChange }: SettingsScreenProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onThemeChange(event.target.value as ThemePreference)
  }

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      role="main"
      aria-label="Settings"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
        <SettingsIcon sx={{ color: 'text.secondary' }} aria-hidden="true" />
        <Typography variant="h6" fontWeight={700}>
          Settings
        </Typography>
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Appearance
          </Typography>

          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="theme-select-label">Theme</InputLabel>
            <Select
              labelId="theme-select-label"
              id="theme-select"
              value={themePreference}
              label="Theme"
              onChange={handleChange}
            >
              <MenuItem value="system">System</MenuItem>
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        More settings coming soon.
      </Typography>
    </Box>
  )
}
