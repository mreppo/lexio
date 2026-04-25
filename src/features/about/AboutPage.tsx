import { Box, Chip, Container, Grid2 as Grid, Link, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import GitHubIcon from '@mui/icons-material/GitHub'
import { Link as RouterLink } from 'react-router-dom'

/** Public GitHub repo URL for this project. */
const GITHUB_URL = 'https://github.com/mreppo/lexio'

/**
 * Dev stats to display on the About page.
 * Keep these as named constants so they are easy to update in one place.
 */
const DEV_STATS: ReadonlyArray<{ readonly label: string; readonly value: string }> = [
  { label: 'GitHub issues', value: '182+' },
  { label: 'PRs merged', value: '182+' },
  { label: 'Human-written lines', value: '0' },
]

/**
 * The "Built by AI" story section, explaining the experiment
 * of building an app with autonomous AI agents.
 */
function AiStorySection(): React.JSX.Element {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip
            label="How it was built"
            size="small"
            sx={{
              mb: 3,
              background: 'rgba(245,158,11,0.12)',
              color: 'primary.main',
              borderColor: 'primary.main',
              border: '1px solid',
            }}
          />
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            One person. Zero hand-written code.
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', maxWidth: 540, mx: 'auto', lineHeight: 1.8 }}
          >
            Lexio is an experiment: what happens when you apply autonomous AI agents to the full
            software development lifecycle?
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <Typography
                component="h2"
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}
              >
                Product Architect
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                A single person defines requirements and user stories in Claude Chat. They describe
                features, acceptance criteria, and product direction — then create GitHub issues.
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <Typography
                component="h2"
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 1.5, color: 'secondary.main' }}
              >
                Agent Team
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                Claude CLI agents pick up issues autonomously: Developer writes the code, QA writes
                and runs tests, Reviewer checks quality, Orchestrator opens and merges PRs.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Dev stats — easy to update in DEV_STATS above */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'center',
          }}
        >
          {DEV_STATS.map((stat) => (
            <Box key={stat.label} sx={{ textAlign: 'center', minWidth: 100 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}

/** Footer with GitHub link. */
function AboutFooter(): React.JSX.Element {
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
        <Stack direction="row" justifyContent="center">
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
 * About page rendered at /#/about.
 * Contains the "Built by AI" story and dev stats.
 * Targets the tech/GitHub audience — English only, no i18n needed.
 */
export function AboutPage(): React.JSX.Element {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d1529 0%, #0a0f1a 40%, #0a0f1a 100%)',
      }}
    >
      {/* Back navigation */}
      <Box sx={{ pt: 3, pb: 1 }}>
        <Container maxWidth="md">
          <Link
            component={RouterLink}
            to="/"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <ArrowBackIcon fontSize="small" />
            <Typography variant="body2">Back to Lexio</Typography>
          </Link>
        </Container>
      </Box>

      <AiStorySection />
      <AboutFooter />
    </Box>
  )
}
