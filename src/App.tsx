import { useMemo } from 'react'
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material'
import { createAppTheme } from './theme'
import { useThemeMode } from './hooks/useThemeMode'
import { LocalStorageService } from './services/storage'

/**
 * A single shared storage instance for the application.
 * Created outside of the component to avoid re-instantiation on every render.
 */
const storageService = new LocalStorageService()

export default function App() {
  const { mode } = useThemeMode(storageService)
  const appTheme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="h3" component="h1" color="primary">
          Hello Lexio
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Your vocabulary trainer
        </Typography>
      </Box>
    </ThemeProvider>
  )
}
