import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
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

describe('App - app route', () => {
  beforeEach(() => {
    // Navigate to the app shell route for these tests.
    window.location.hash = '#/app'
  })

  it('should show onboarding on first launch (no pairs in storage)', async () => {
    await act(async () => {
      render(<App />)
    })
    // Allow Suspense lazy-loading and async storage reads to resolve.
    await waitFor(
      () => expect(screen.getByRole('button', { name: /try it now/i })).toBeInTheDocument(),
      { timeout: 3000 },
    )
  })

  it('should show the Lexio heading in the onboarding welcome step on first launch', async () => {
    await act(async () => {
      render(<App />)
    })
    // Allow Suspense lazy-loading and async storage reads to resolve.
    await waitFor(() => expect(screen.getAllByText('Lexio').length).toBeGreaterThan(0), {
      timeout: 3000,
    })
  })
})
