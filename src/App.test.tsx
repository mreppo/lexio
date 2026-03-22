import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import App from './App'

// The App uses LocalStorageService which internally calls localStorage.
// jsdom provides localStorage so no special mocking is needed for basic rendering.
// We just ensure matchMedia is defined (jsdom may not provide it).
beforeEach(() => {
  localStorage.clear()
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

describe('App', () => {
  it('should render inside a ThemeProvider (MUI CssBaseline present)', async () => {
    let container: Element
    await act(async () => {
      const result = render(<App />)
      container = result.container
    })
    // CssBaseline injects a <style> tag - verify the app mounts without throwing
    expect(container!.firstChild).not.toBeNull()
  })

  it('should show onboarding on first launch (no pairs in storage)', async () => {
    await act(async () => {
      render(<App />)
    })
    // After loading completes with no pairs, the onboarding welcome step is shown.
    await act(async () => {})
    expect(screen.getByRole('button', { name: /try it now/i })).toBeInTheDocument()
  })

  it('should show the Lexio heading in the onboarding welcome step on first launch', async () => {
    await act(async () => {
      render(<App />)
    })
    await act(async () => {})
    // The onboarding flow renders "Lexio" as the h3 heading on the welcome step.
    expect(screen.getAllByText('Lexio').length).toBeGreaterThan(0)
  })
})
