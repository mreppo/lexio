import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { IconGlyph, ICON_MAP } from './IconGlyph'
import { Flame } from 'lucide-react'

function renderWithTheme(ui: React.ReactNode, mode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('IconGlyph', () => {
  it('should render by name without crash', () => {
    const { container } = renderWithTheme(<IconGlyph name="flame" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render by component prop', () => {
    const { container } = renderWithTheme(<IconGlyph component={Flame} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render with decorative aria-hidden', () => {
    const { container } = renderWithTheme(<IconGlyph name="check" decorative />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('should render all 17 icon names without crash', () => {
    const names = Object.keys(ICON_MAP) as Array<keyof typeof ICON_MAP>
    for (const name of names) {
      const { container } = renderWithTheme(<IconGlyph name={name} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    }
  })

  it('should render chevronRight icon', () => {
    const { container } = renderWithTheme(<IconGlyph name="chevronRight" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render close icon', () => {
    const { container } = renderWithTheme(<IconGlyph name="close" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render x as alias for close', () => {
    const { container } = renderWithTheme(<IconGlyph name="x" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should apply custom size', () => {
    const { container } = renderWithTheme(<IconGlyph name="search" size={32} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('should render in dark mode', () => {
    const { container } = renderWithTheme(<IconGlyph name="settings" />, 'dark')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
