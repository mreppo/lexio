import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Grid2 as Grid,
  Typography,
  Link,
  Stack,
  Paper,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import TuneIcon from '@mui/icons-material/Tune'
import BarChartIcon from '@mui/icons-material/BarChart'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import GitHubIcon from '@mui/icons-material/GitHub'
import { useLandingI18n } from './useLandingI18n'
import type { LandingTranslations } from './useLandingI18n'

/** Public GitHub repo URL for this project. */
const GITHUB_URL = 'https://github.com/mreppo/lexio'

declare const __APP_VERSION__: string

// Icon set for each feature — order must match the translations.features array.
const FEATURE_ICONS: ReadonlyArray<React.ReactNode> = [
  <SchoolIcon key="school" fontSize="medium" sx={{ color: 'primary.main' }} />,
  <TuneIcon key="tune" fontSize="medium" sx={{ color: 'primary.main' }} />,
  <BarChartIcon key="bar-chart" fontSize="medium" sx={{ color: 'primary.main' }} />,
  <WifiOffIcon key="wifi-off" fontSize="medium" sx={{ color: 'primary.main' }} />,
]

/**
 * Pill-style EN | LV language toggle shown in the top-right corner.
 * Uses a ButtonGroup with two compact buttons to keep the control minimal.
 */
function LangToggle({
  lang,
  onToggle,
}: {
  lang: 'en' | 'lv'
  onToggle: () => void
}): React.JSX.Element {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: 12, sm: 16 },
        right: { xs: 12, sm: 20 },
        zIndex: 1200,
      }}
    >
      <ButtonGroup
        size="small"
        aria-label="Language toggle"
        sx={{
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(10,15,26,0.7)',
        }}
      >
        <Button
          onClick={lang === 'lv' ? onToggle : undefined}
          disableRipple={lang === 'en'}
          aria-pressed={lang === 'en'}
          sx={{
            px: 1.5,
            py: 0.5,
            minWidth: 40,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: lang === 'en' ? '#f59e0b' : 'text.secondary',
            backgroundColor: lang === 'en' ? 'rgba(245,158,11,0.12)' : 'transparent',
            border: 'none',
            borderRadius: 0,
            cursor: lang === 'en' ? 'default' : 'pointer',
            '&:hover': {
              backgroundColor: lang === 'en' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
            },
          }}
        >
          EN
        </Button>
        <Button
          onClick={lang === 'en' ? onToggle : undefined}
          disableRipple={lang === 'lv'}
          aria-pressed={lang === 'lv'}
          sx={{
            px: 1.5,
            py: 0.5,
            minWidth: 40,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: lang === 'lv' ? '#f59e0b' : 'text.secondary',
            backgroundColor: lang === 'lv' ? 'rgba(245,158,11,0.12)' : 'transparent',
            border: 'none',
            borderRadius: 0,
            cursor: lang === 'lv' ? 'default' : 'pointer',
            '&:hover': {
              backgroundColor: lang === 'lv' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
            },
          }}
        >
          LV
        </Button>
      </ButtonGroup>
    </Box>
  )
}

/** The hero section with app title, tagline, and CTAs. */
function HeroSection({ t }: { t: LandingTranslations }): React.JSX.Element {
  const navigate = useNavigate()

  const handleTryNow = useCallback(() => {
    void navigate('/app?demo=true')
  }, [navigate])

  const handleSetUp = useCallback(() => {
    void navigate('/app')
  }, [navigate])

  return (
    <Box
      component="section"
      sx={{
        minHeight: { xs: '90vh', md: '80vh' },
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="md">
        {/* Logo / brand mark */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 4,
            boxShadow: '0 0 40px rgba(245,158,11,0.4)',
          }}
        >
          <Typography variant="h4" component="span" sx={{ color: '#0a0f1a', fontWeight: 700 }}>
            L
          </Typography>
        </Box>

        <Typography
          component="h1"
          variant="h2"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Lexio
        </Typography>

        <Typography
          component="h2"
          variant="h5"
          sx={{
            color: 'text.primary',
            mb: 2,
            fontWeight: 600,
            maxWidth: 560,
            mx: 'auto',
          }}
        >
          {t.heroTagline}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mb: 5,
            maxWidth: 480,
            mx: 'auto',
            lineHeight: 1.7,
          }}
        >
          {t.heroSubtitle}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleTryNow}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              borderRadius: 3,
              minWidth: 180,
              boxShadow: '0 0 24px rgba(245,158,11,0.35)',
              // #0A84FF (dark-mode primary) gives only 3.65:1 with white.
              // Override to use the amber accent from the brand gradient so
              // the landing-page CTA has sufficient contrast (≥ 4.5:1).
              backgroundColor: '#f59e0b',
              color: '#0a0f1a',
              '&:hover': { backgroundColor: '#d97706' },
            }}
          >
            {t.tryItNow}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={handleSetUp}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              borderRadius: 3,
              minWidth: 180,
            }}
          >
            {t.setUpYourOwn}
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}

/** Styled placeholder that communicates the app visually without real screenshots. */
function AppMockup(): React.JSX.Element {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: { xs: 280, sm: 320 },
        mx: 'auto',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(160deg, #0d1529 0%, #0a0f1a 100%)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
        p: 3,
      }}
    >
      {/* Status bar imitation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, opacity: 0.5 }}>
        <Typography variant="caption">9:41</Typography>
        <Typography variant="caption">Lexio</Typography>
      </Box>

      {/* Quiz card imitation */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          textAlign: 'center',
          borderRadius: 3,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Translate to English
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
          ābols
        </Typography>
      </Paper>

      {/* Answer options imitation */}
      {['apple', 'pear', 'orange', 'grape'].map((word, i) => (
        <Box
          key={word}
          sx={{
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: i === 0 ? 'success.main' : 'divider',
            background: i === 0 ? 'rgba(34,197,94,0.12)' : 'transparent',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: i === 0 ? 'success.light' : 'text.secondary',
              fontWeight: i === 0 ? 600 : 400,
            }}
          >
            {word}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

/** Feature highlights grid. */
function FeaturesSection({ t }: { t: LandingTranslations }): React.JSX.Element {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 10 } }}>
      <Container maxWidth="md">
        <Typography
          component="h2"
          variant="h4"
          sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}
        >
          {t.featuresSectionTitle}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', textAlign: 'center', mb: 6, maxWidth: 480, mx: 'auto' }}
        >
          {t.featuresSectionSubtitle}
        </Typography>

        <Grid container spacing={3}>
          {t.features.map((f, i) => (
            <Grid key={f.title} size={{ xs: 12, sm: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Box sx={{ flexShrink: 0, mt: 0.25 }}>{FEATURE_ICONS[i]}</Box>
                <Box>
                  <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {f.body}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* App mockup below features on mobile */}
        <Box sx={{ mt: 6 }}>
          <AppMockup />
        </Box>
      </Container>
    </Box>
  )
}

/** Footer with attribution and links. */
function FooterSection({ t }: { t: LandingTranslations }): React.JSX.Element {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="md">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Link href="/#/about" sx={{ color: 'text.secondary' }}>
              <Typography variant="body2">{t.footerHowBuilt}</Typography>
            </Link>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              · v{__APP_VERSION__}
            </Typography>
          </Stack>

          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}
          >
            <GitHubIcon fontSize="small" />
            <Typography variant="body2">GitHub</Typography>
          </Link>
        </Stack>
      </Container>
    </Box>
  )
}

/**
 * Landing page rendered at the root route /.
 * Shows hero, feature highlights, and footer.
 * Includes a LV/EN language toggle pill in the top-right corner.
 * Does NOT include the app bar or bottom nav.
 */
export function LandingPage(): React.JSX.Element {
  const { t, lang, toggle } = useLandingI18n()

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d1529 0%, #0a0f1a 40%, #0a0f1a 100%)',
      }}
    >
      <LangToggle lang={lang} onToggle={toggle} />
      <HeroSection t={t} />
      <FeaturesSection t={t} />
      <FooterSection t={t} />
    </Box>
  )
}
