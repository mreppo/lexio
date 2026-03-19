import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material'
import { theme } from './theme'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
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
