import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import { LandingPage } from './LandingPage'
import { StorageContext } from '@/hooks/useStorage'
import type { StorageService } from '@/services/storage/StorageService'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>() // eslint-disable-line @typescript-eslint/consistent-type-imports
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const darkTheme = createAppTheme('dark')

/** Builds a minimal StorageService mock with controllable getItem behaviour. */
function makeMockStorage(persistedLang: string | null = null): StorageService {
  return {
    getItem: vi.fn().mockResolvedValue(persistedLang),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    // Remaining methods — not exercised by landing page tests.
    getLanguagePairs: vi.fn().mockResolvedValue([]),
    getLanguagePair: vi.fn().mockResolvedValue(null),
    saveLanguagePair: vi.fn().mockResolvedValue(undefined),
    deleteLanguagePair: vi.fn().mockResolvedValue(undefined),
    getWords: vi.fn().mockResolvedValue([]),
    getWord: vi.fn().mockResolvedValue(null),
    saveWord: vi.fn().mockResolvedValue(undefined),
    saveWords: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockResolvedValue(undefined),
    getWordProgress: vi.fn().mockResolvedValue(null),
    getAllProgress: vi.fn().mockResolvedValue([]),
    saveWordProgress: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue({}),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    getDailyStats: vi.fn().mockResolvedValue(null),
    getDailyStatsRange: vi.fn().mockResolvedValue([]),
    saveDailyStats: vi.fn().mockResolvedValue(undefined),
    getRecentDailyStats: vi.fn().mockResolvedValue([]),
    exportAll: vi.fn().mockResolvedValue('{}'),
    importAll: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  } as unknown as StorageService
}

function renderLanding(storage: StorageService = makeMockStorage()) {
  return render(
    <StorageContext.Provider value={storage}>
      <MemoryRouter>
        <ThemeProvider theme={darkTheme}>
          <LandingPage />
        </ThemeProvider>
      </MemoryRouter>
    </StorageContext.Provider>,
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: English browser locale so auto-detection yields 'en'.
    Object.defineProperty(navigator, 'language', { value: 'en-GB', configurable: true })
  })

  it('should render the app name', () => {
    renderLanding()
    expect(screen.getAllByText('Lexio').length).toBeGreaterThan(0)
  })

  it('should render hero tagline in English by default', () => {
    renderLanding()
    expect(screen.getByText(/learn vocabulary in any language/i)).toBeInTheDocument()
  })

  it('should render learner-focused hero subtitle in English by default', () => {
    renderLanding()
    expect(screen.getByText(/a simple way to practise vocabulary every day/i)).toBeInTheDocument()
  })

  it('should not render the old tech-story subtitle', () => {
    renderLanding()
    expect(screen.queryByText(/built entirely by autonomous ai agents/i)).not.toBeInTheDocument()
  })

  it('should render the Try it now CTA button in English', () => {
    renderLanding()
    expect(screen.getByRole('button', { name: /try it now/i })).toBeInTheDocument()
  })

  it('should render the Set up your own CTA button in English', () => {
    renderLanding()
    expect(screen.getByRole('button', { name: /set up your own/i })).toBeInTheDocument()
  })

  it('should navigate to /app?demo=true when Try it now is clicked', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: /try it now/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/app?demo=true')
  })

  it('should navigate to /app when Set up your own is clicked', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: /set up your own/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/app')
  })

  it('should render feature highlights section in English', () => {
    renderLanding()
    expect(screen.getByText(/spaced repetition/i)).toBeInTheDocument()
    expect(screen.getByText(/multiple quiz modes/i)).toBeInTheDocument()
    expect(screen.getByText(/progress and streaks/i)).toBeInTheDocument()
    expect(screen.getByText(/works offline/i)).toBeInTheDocument()
  })

  it('should not render the AI story section', () => {
    renderLanding()
    expect(screen.queryByText(/one person.*zero hand-written code/i)).not.toBeInTheDocument()
  })

  it('should not render the stats block', () => {
    renderLanding()
    expect(screen.queryByText(/96\+/)).not.toBeInTheDocument()
    expect(screen.queryByText(/108\+/)).not.toBeInTheDocument()
    expect(screen.queryByText(/human-written lines/i)).not.toBeInTheDocument()
  })

  it('should render "How it was built" link in footer pointing to /#/about', () => {
    renderLanding()
    const link = screen.getByRole('link', { name: /how it was built/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/#/about')
  })

  it('should render GitHub link in footer', () => {
    renderLanding()
    const githubLinks = screen.getAllByRole('link', { name: /github/i })
    expect(githubLinks.length).toBeGreaterThan(0)
  })

  it('should render the app mockup with Latvian diacritic word', () => {
    renderLanding()
    expect(screen.getByText('ābols')).toBeInTheDocument()
  })

  it('should render the h1 heading with accessible role', () => {
    renderLanding()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading.textContent).toBe('Lexio')
  })

  it('should render section headings for the features section', () => {
    renderLanding()
    const h2Headings = screen.getAllByRole('heading', { level: 2 })
    expect(h2Headings.length).toBeGreaterThanOrEqual(1)
  })
})

describe('LandingPage — language toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'language', { value: 'en-GB', configurable: true })
  })

  it('should render EN and LV toggle buttons', () => {
    renderLanding()
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LV' })).toBeInTheDocument()
  })

  it('should switch all text to Latvian when LV is clicked', async () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: 'LV' }))
    await waitFor(() => {
      expect(screen.getByText(/Apgūsti vārdnīcu jebkurā valodā/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Izmēģini tagad/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iestatīt pašam/i })).toBeInTheDocument()
  })

  it('should switch back to English when EN is clicked after LV', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: 'LV' }))
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByText(/learn vocabulary in any language/i)).toBeInTheDocument()
  })

  it('should persist language choice via storage.setItem when toggled', async () => {
    const storage = makeMockStorage()
    renderLanding(storage)
    fireEvent.click(screen.getByRole('button', { name: 'LV' }))
    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalledWith('lexio-landing-lang', 'lv')
    })
  })

  it('should use persisted LV language on mount', async () => {
    const storage = makeMockStorage('lv')
    renderLanding(storage)
    await waitFor(() => {
      expect(screen.getByText(/Apgūsti vārdnīcu jebkurā valodā/i)).toBeInTheDocument()
    })
  })

  it('should use persisted EN language on mount even when browser is LV', async () => {
    Object.defineProperty(navigator, 'language', { value: 'lv-LV', configurable: true })
    const storage = makeMockStorage('en')
    renderLanding(storage)
    // Initially browser detection may yield LV, but persisted 'en' overrides it.
    await waitFor(() => {
      expect(screen.getByText(/learn vocabulary in any language/i)).toBeInTheDocument()
    })
  })

  it('should auto-detect Latvian from navigator.language when no persisted value', async () => {
    Object.defineProperty(navigator, 'language', { value: 'lv-LV', configurable: true })
    const storage = makeMockStorage(null)
    renderLanding(storage)
    // With LV browser locale and no persisted value, the hook should stay on LV.
    await waitFor(() => {
      expect(screen.getByText(/Apgūsti vārdnīcu jebkurā valodā/i)).toBeInTheDocument()
    })
  })

  it('should navigate to /app?demo=true from Latvian version when CTA clicked', async () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: 'LV' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Izmēģini tagad/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Izmēģini tagad/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/app?demo=true')
  })
})

describe('useLandingI18n — unit coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render Latvian feature titles when language is LV', async () => {
    Object.defineProperty(navigator, 'language', { value: 'lv', configurable: true })
    renderLanding(makeMockStorage(null))
    await waitFor(() => {
      expect(screen.getByText(/Intervālu atkārtošana/i)).toBeInTheDocument()
    })
  })

  it('should render Latvian footer link when language is LV', async () => {
    const storage = makeMockStorage('lv')
    renderLanding(storage)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Kā tas tika izveidots/i })).toBeInTheDocument()
    })
  })
})
