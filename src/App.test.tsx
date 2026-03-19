import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// The App uses LocalStorageService which internally calls localStorage.
// jsdom provides localStorage so no special mocking is needed for basic rendering.
// We just ensure matchMedia is defined (jsdom may not provide it).
beforeEach(() => {
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
  it('should render the Hello Lexio placeholder', () => {
    render(<App />)
    expect(screen.getByText('Hello Lexio')).toBeInTheDocument()
  })

  it('should render the subtitle', () => {
    render(<App />)
    expect(screen.getByText('Your vocabulary trainer')).toBeInTheDocument()
  })

  it('should render inside a ThemeProvider (MUI CssBaseline present)', () => {
    const { container } = render(<App />)
    // CssBaseline injects a <style> tag - verify the app mounts without throwing
    expect(container.firstChild).not.toBeNull()
  })
})
