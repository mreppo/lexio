import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { Progress } from './Progress'

function renderWithTheme(ui: React.ReactNode, mode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('Progress', () => {
  it('should render with role="progressbar"', () => {
    renderWithTheme(<Progress value={0.5} aria-label="Quiz progress" />)
    expect(screen.getByRole('progressbar', { name: 'Quiz progress' })).toBeInTheDocument()
  })

  it('should have aria-valuenow matching percent', () => {
    renderWithTheme(<Progress value={0.5} aria-label="Progress" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '50')
  })

  it('should have aria-valuemin="0"', () => {
    renderWithTheme(<Progress value={0.3} aria-label="Progress" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0')
  })

  it('should have aria-valuemax="100"', () => {
    renderWithTheme(<Progress value={0.7} aria-label="Progress" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100')
  })

  it('should render accent tone', () => {
    renderWithTheme(<Progress value={0.4} tone="accent" aria-label="Accent" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should render ok tone', () => {
    renderWithTheme(<Progress value={0.8} tone="ok" aria-label="Ok" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should render ink tone', () => {
    renderWithTheme(<Progress value={0.2} tone="ink" aria-label="Ink" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should clamp value above 1 to 100%', () => {
    renderWithTheme(<Progress value={2} aria-label="Clamped" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '100')
  })

  it('should clamp value below 0 to 0%', () => {
    renderWithTheme(<Progress value={-1} aria-label="Clamped" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
  })

  it('should render in dark mode', () => {
    renderWithTheme(<Progress value={0.5} aria-label="Dark" />, 'dark')
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
