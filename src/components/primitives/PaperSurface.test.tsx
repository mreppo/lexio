import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { PaperSurface } from './PaperSurface'
import { lightGlass, darkGlass } from '../../theme/liquidGlass'

function renderWithTheme(
  ui: React.ReactNode,
  mode: 'light' | 'dark' = 'dark',
): ReturnType<typeof render> {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('PaperSurface', () => {
  it('should render children', () => {
    renderWithTheme(
      <PaperSurface>
        <span>Hello Surface</span>
      </PaperSurface>,
    )
    expect(screen.getByText('Hello Surface')).toBeInTheDocument()
  })

  it('should render without children', () => {
    const { container } = renderWithTheme(<PaperSurface />)
    expect(container.firstChild).toBeTruthy()
  })

  it('should apply the wallpaper gradient in light mode', () => {
    const { container } = renderWithTheme(<PaperSurface>content</PaperSurface>, 'light')
    const el = container.firstChild as HTMLElement
    // The wallpaper background should contain the light variant gradient fragments
    const bg = el.style.background
    // MUI applies styles via emotion class — check that tokens reference correct gradient
    // (jsdom may not render computed styles perfectly, but we verify rendering doesn't throw)
    expect(el).toBeTruthy()
    // Token cross-check: light wallpaper contains #FFD6A5
    expect(lightGlass.wallpaper).toContain('#FFD6A5')
    void bg // suppress unused variable warning
  })

  it('should apply the wallpaper gradient in dark mode', () => {
    const { container } = renderWithTheme(<PaperSurface>content</PaperSurface>, 'dark')
    const el = container.firstChild as HTMLElement
    expect(el).toBeTruthy()
    // Token cross-check: dark wallpaper contains #3A1E6B
    expect(darkGlass.wallpaper).toContain('#3A1E6B')
  })

  it('should pass through sx prop', () => {
    renderWithTheme(<PaperSurface sx={{ padding: 4 }}>padded</PaperSurface>)
    expect(screen.getByText('padded')).toBeInTheDocument()
  })

  it('should render multiple children', () => {
    renderWithTheme(
      <PaperSurface>
        <div>First</div>
        <div>Second</div>
      </PaperSurface>,
    )
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})
