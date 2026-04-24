import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import App from './App'

// The App uses LocalStorageService which internally calls localStorage.
// jsdom provides localStorage so no special mocking is needed for basic rendering.
// We just ensure matchMedia is defined (jsdom may not provide it).
beforeEach(() => {
  localStorage.clear()
  // Reset hash to the landing page route before each test.
  window.location.hash = '#/'
  if (!globalThis.matchMedia) {
    vi.spyOn(globalThis, 'matchMedia').mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)
  }
})

afterEach(() => {
  window.location.hash = ''
})

describe('App - landing page route', () => {
  it('should render inside a ThemeProvider (MUI CssBaseline present)', async () => {
    let container: Element
    await act(async () => {
      const result = render(<App />)
      container = result.container
    })
    // CssBaseline injects a <style> tag - verify the app mounts without throwing
    expect(container!.firstChild).not.toBeNull()
  })

  it('should render the landing page at the root route', async () => {
    window.location.hash = '#/'
    await act(async () => {
      render(<App />)
    })
    await act(async () => {})
    // The landing page renders the Lexio brand name and the CTAs.
    expect(screen.getAllByText('Lexio').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /try it now/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set up your own/i })).toBeInTheDocument()
  })
})

describe('App - app shell (AppContent direct)', () => {
  it('should show onboarding on first launch (no pairs in storage)', async () => {
    // Import AppContent directly to avoid routing/Suspense complexity in tests.
    const { default: AppContent } = await import('./AppContent')
    const { LocalStorageService } = await import('./services/storage')
    const { StorageContext } = await import('./hooks/useStorage')
    const storage = new LocalStorageService()
    await act(async () => {
      render(
        <StorageContext.Provider value={storage}>
          <AppContent />
        </StorageContext.Provider>,
      )
    })
    await act(async () => {})
    // After loading completes with no pairs, the onboarding welcome step is shown.
    expect(screen.getByRole('button', { name: /try it now/i })).toBeInTheDocument()
  })

  it('should show the "Welcome to Lexio" label in the onboarding welcome step on first launch', async () => {
    // Import AppContent directly to avoid routing/Suspense complexity in tests.
    const { default: AppContent } = await import('./AppContent')
    const { LocalStorageService } = await import('./services/storage')
    const { StorageContext } = await import('./hooks/useStorage')
    const storage = new LocalStorageService()
    await act(async () => {
      render(
        <StorageContext.Provider value={storage}>
          <AppContent />
        </StorageContext.Provider>,
      )
    })
    await act(async () => {})
    // The onboarding flow renders "Welcome to Lexio" as the uppercase label on the welcome step.
    expect(screen.getByText(/welcome to lexio/i)).toBeInTheDocument()
  })
})
