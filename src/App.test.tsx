import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import App from './App'

// The App uses LocalStorageService which internally calls localStorage.
// jsdom provides localStorage so no special mocking is needed for basic rendering.
// We just ensure matchMedia is defined (jsdom may not provide it).
beforeEach(() => {
  localStorage.clear()
  if (!window.matchMedia) {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
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
  it('should render the Lexio brand name in the AppBar', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByText('Lexio')).toBeInTheDocument()
  })

  it('should render inside a ThemeProvider (MUI CssBaseline present)', async () => {
    let container: Element
    await act(async () => {
      const result = render(<App />)
      container = result.container
    })
    // CssBaseline injects a <style> tag - verify the app mounts without throwing
    expect(container!.firstChild).not.toBeNull()
  })

  it('should show the welcome message when no pairs exist', async () => {
    await act(async () => {
      render(<App />)
    })
    // After loading completes, with no pairs stored, welcome screen appears
    await act(async () => {})
    expect(screen.getByText('Welcome to Lexio')).toBeInTheDocument()
  })

  it('should open the create pair dialog on first launch', async () => {
    await act(async () => {
      render(<App />)
    })
    await act(async () => {})
    // First launch triggers the dialog
    expect(screen.getByRole('dialog', { name: /Add language pair/i })).toBeInTheDocument()
  })
})
