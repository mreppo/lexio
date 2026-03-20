import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import { StorageContext } from '@/hooks/useStorage'
import type { StorageService } from '@/services/storage/StorageService'
import { OnboardingFlow } from './OnboardingFlow'
import type { LanguagePair } from '@/types'
import type { CreatePairInput } from '@/features/language-pairs'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockTheme = createAppTheme('dark')

function makeStorageMock(): StorageService {
  return {
    getLanguagePairs: vi.fn().mockResolvedValue([]),
    saveLanguagePair: vi.fn().mockResolvedValue(undefined),
    deleteLanguagePair: vi.fn().mockResolvedValue(undefined),
    getWords: vi.fn().mockResolvedValue([]),
    saveWords: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockResolvedValue(undefined),
    getWordProgress: vi.fn().mockResolvedValue(null),
    saveWordProgress: vi.fn().mockResolvedValue(undefined),
    getAllWordProgress: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue({
      activePairId: null,
      quizMode: 'type',
      dailyGoal: 20,
      theme: 'system',
      typoTolerance: 1,
    }),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    getDailyStats: vi.fn().mockResolvedValue(null),
    saveDailyStats: vi.fn().mockResolvedValue(undefined),
    getAllDailyStats: vi.fn().mockResolvedValue([]),
    exportAll: vi.fn().mockResolvedValue({}),
    importAll: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  } as unknown as StorageService
}

function makePair(overrides: Partial<LanguagePair> = {}): LanguagePair {
  return {
    id: 'pair-1',
    sourceLang: 'English',
    sourceCode: 'en',
    targetLang: 'Latvian',
    targetCode: 'lv',
    createdAt: Date.now(),
    ...overrides,
  }
}

/**
 * Creates a typed mock for the onCreatePair callback.
 * Returns the EN-LV pair by default.
 */
function makeCreatePairMock(
  returnValue: LanguagePair = makePair(),
): (input: CreatePairInput) => Promise<LanguagePair> {
  return vi.fn<(input: CreatePairInput) => Promise<LanguagePair>>().mockResolvedValue(returnValue)
}

function renderFlow(
  onComplete = vi.fn(),
  onCreatePair: (input: CreatePairInput) => Promise<LanguagePair> = makeCreatePairMock(),
  storageMock: StorageService = makeStorageMock(),
) {
  return render(
    <StorageContext.Provider value={storageMock}>
      <ThemeProvider theme={mockTheme}>
        <OnboardingFlow onComplete={onComplete} onCreatePair={onCreatePair} />
      </ThemeProvider>
    </StorageContext.Provider>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  // Silence fetch errors from listPacks in the AddWords step during tests.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no fetch in tests')))
})

describe('OnboardingFlow', () => {
  describe('Step 1: Welcome', () => {
    it('should render the welcome step by default', () => {
      renderFlow()
      expect(screen.getByText('Get started')).toBeInTheDocument()
      // The "Lexio" heading is present in the welcome step.
      expect(screen.getAllByText('Lexio').length).toBeGreaterThan(0)
    })

    it('should show a tagline on the welcome step', () => {
      renderFlow()
      expect(screen.getByText(/active recall and spaced repetition/i)).toBeInTheDocument()
    })

    it('should advance to the language pair step when "Get started" is clicked', async () => {
      renderFlow()
      await userEvent.click(screen.getByRole('button', { name: /get started/i }))
      expect(screen.getByText(/create your first language pair/i)).toBeInTheDocument()
    })

    it('should show a progress stepper with 4 steps', () => {
      renderFlow()
      // MobileStepper renders dot elements; we check 4 dots are rendered.
      const dots = document.querySelectorAll('.MuiMobileStepper-dot')
      expect(dots.length).toBe(4)
    })
  })

  describe('Step 2: Language Pair', () => {
    async function advanceToStep2() {
      renderFlow()
      await userEvent.click(screen.getByRole('button', { name: /get started/i }))
    }

    it('should pre-fill with EN-LV default pair', async () => {
      await advanceToStep2()
      const inputs = screen.getAllByRole('combobox')
      // First autocomplete is source language.
      expect(inputs[0]).toHaveValue('English (en)')
    })

    it('should show popular preset chips', async () => {
      await advanceToStep2()
      expect(screen.getByRole('button', { name: /EN → LV/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /EN → DE/i })).toBeInTheDocument()
    })

    it('should call onCreatePair when Continue is clicked with valid form', async () => {
      const onCreatePair = makeCreatePairMock()
      renderFlow(vi.fn(), onCreatePair)
      await userEvent.click(screen.getByRole('button', { name: /get started/i }))
      await userEvent.click(screen.getByRole('button', { name: /continue/i }))
      expect(onCreatePair).toHaveBeenCalledWith({
        sourceLang: 'English',
        sourceCode: 'en',
        targetLang: 'Latvian',
        targetCode: 'lv',
      })
    })

    it('should show error if form fields are empty', async () => {
      await advanceToStep2()

      // Clear the source language autocomplete.
      const inputs = screen.getAllByRole('combobox')
      await userEvent.clear(inputs[0])

      // Find "Continue" button and click.
      await userEvent.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should update form when a preset chip is clicked', async () => {
      await advanceToStep2()
      await userEvent.click(screen.getByRole('button', { name: /EN → DE/i }))
      const inputs = screen.getAllByRole('combobox')
      expect(inputs[1]).toHaveValue('German (de)')
    })

    it('should advance to add words step after pair creation', async () => {
      const onCreatePair = makeCreatePairMock()
      renderFlow(vi.fn(), onCreatePair)
      await userEvent.click(screen.getByRole('button', { name: /get started/i }))
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /continue/i }))
      })
      await waitFor(() => {
        expect(screen.getByText(/add your first words/i)).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: Add Words', () => {
    async function advanceToStep3() {
      const onCreatePair = makeCreatePairMock()
      renderFlow(vi.fn(), onCreatePair)
      await userEvent.click(screen.getByRole('button', { name: /get started/i }))
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /continue/i }))
      })
      await waitFor(() => {
        expect(screen.getByText(/add your first words/i)).toBeInTheDocument()
      })
    }

    it('should show the add words options', async () => {
      await advanceToStep3()
      expect(screen.getByText(/add my own words/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
    })

    it('should advance to tutorial when "Skip for now" is clicked', async () => {
      await advanceToStep3()
      await userEvent.click(screen.getByRole('button', { name: /skip for now/i }))
      await waitFor(() => {
        expect(screen.getByText(/how lexio works/i)).toBeInTheDocument()
      })
    })

    it('should advance to tutorial when "Add my own words" card is clicked', async () => {
      await advanceToStep3()
      await userEvent.click(screen.getByText(/add my own words/i))
      await waitFor(() => {
        expect(screen.getByText(/how lexio works/i)).toBeInTheDocument()
      })
    })
  })

  describe('Step 4: Tutorial', () => {
    async function advanceToStep4() {
      const onCreatePair = makeCreatePairMock()
      renderFlow(vi.fn(), onCreatePair)
      await userEvent.click(screen.getByRole('button', { name: /get started/i }))
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /continue/i }))
      })
      await waitFor(() => {
        expect(screen.getByText(/add your first words/i)).toBeInTheDocument()
      })
      await userEvent.click(screen.getByRole('button', { name: /skip for now/i }))
      await waitFor(() => {
        expect(screen.getByText(/how lexio works/i)).toBeInTheDocument()
      })
    }

    it('should render the first tutorial slide', async () => {
      await advanceToStep4()
      expect(screen.getByText(/type mode/i)).toBeInTheDocument()
    })

    it('should navigate to the next slide when "Next" is clicked', async () => {
      await advanceToStep4()
      await userEvent.click(screen.getByRole('button', { name: /next/i }))
      expect(screen.getByText(/choice mode/i)).toBeInTheDocument()
    })

    it('should navigate back when "Back" is clicked on slide 2', async () => {
      await advanceToStep4()
      await userEvent.click(screen.getByRole('button', { name: /next/i }))
      await userEvent.click(screen.getByRole('button', { name: /back/i }))
      expect(screen.getByText(/type mode/i)).toBeInTheDocument()
    })

    it('should show "Start learning!" on the last slide', async () => {
      await advanceToStep4()
      // Advance through all slides.
      await userEvent.click(screen.getByRole('button', { name: /next/i }))
      await userEvent.click(screen.getByRole('button', { name: /next/i }))
      await userEvent.click(screen.getByRole('button', { name: /next/i }))
      expect(screen.getByRole('button', { name: /start learning/i })).toBeInTheDocument()
    })

    it('should call onComplete when "Start learning!" is clicked', async () => {
      const onComplete = vi.fn()
      render(
        <StorageContext.Provider value={makeStorageMock()}>
          <ThemeProvider theme={mockTheme}>
            <OnboardingFlow onComplete={onComplete} onCreatePair={makeCreatePairMock()} />
          </ThemeProvider>
        </StorageContext.Provider>,
      )
      await userEvent.click(screen.getByRole('button', { name: /get started/i }))
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /continue/i }))
      })
      await waitFor(() => expect(screen.getByText(/add your first words/i)).toBeInTheDocument())
      await userEvent.click(screen.getByRole('button', { name: /skip for now/i }))
      await waitFor(() => expect(screen.getByText(/how lexio works/i)).toBeInTheDocument())
      await userEvent.click(screen.getByRole('button', { name: /next/i }))
      await userEvent.click(screen.getByRole('button', { name: /next/i }))
      await userEvent.click(screen.getByRole('button', { name: /next/i }))
      await userEvent.click(screen.getByRole('button', { name: /start learning!/i }))
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should call onComplete when "Skip tutorial" is clicked', async () => {
      const onComplete = vi.fn()
      render(
        <StorageContext.Provider value={makeStorageMock()}>
          <ThemeProvider theme={mockTheme}>
            <OnboardingFlow onComplete={onComplete} onCreatePair={makeCreatePairMock()} />
          </ThemeProvider>
        </StorageContext.Provider>,
      )
      await userEvent.click(screen.getByRole('button', { name: /get started/i }))
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /continue/i }))
      })
      await waitFor(() => expect(screen.getByText(/add your first words/i)).toBeInTheDocument())
      await userEvent.click(screen.getByRole('button', { name: /skip for now/i }))
      await waitFor(() => expect(screen.getByText(/how lexio works/i)).toBeInTheDocument())
      await userEvent.click(screen.getByRole('button', { name: /skip tutorial/i }))
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })
})

describe('First-launch detection (App integration)', () => {
  it('should show onboarding when no language pairs exist in storage', async () => {
    localStorage.clear()
    const { default: App } = await import('@/App')
    await act(async () => {
      render(<App />)
    })
    await act(async () => {})
    expect(screen.getByText('Get started')).toBeInTheDocument()
  })

  it('should show the dashboard (skip onboarding) when a pair already exists in storage', async () => {
    // Pre-seed storage with a language pair so the app skips onboarding.
    // Keys must match LocalStorageService KEYS constants.
    const pair: LanguagePair = makePair()
    localStorage.setItem('lexio:language-pairs', JSON.stringify([pair]))
    localStorage.setItem(
      'lexio:settings',
      JSON.stringify({
        activePairId: pair.id,
        quizMode: 'type',
        dailyGoal: 20,
        theme: 'dark',
        typoTolerance: 1,
      }),
    )

    const { default: App } = await import('@/App')
    await act(async () => {
      render(<App />)
    })
    await act(async () => {})
    // The main app bar "Lexio" brand is present, and onboarding "Get started" is absent.
    expect(screen.queryByText('Get started')).not.toBeInTheDocument()
    // AppBar Lexio heading is present.
    expect(screen.getAllByText('Lexio').length).toBeGreaterThan(0)
  })
})
