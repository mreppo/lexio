import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { Chip } from './Chip'

function renderWithTheme(ui: React.ReactNode, mode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('Chip', () => {
  it('should render children', () => {
    renderWithTheme(<Chip>DUE TODAY</Chip>)
    expect(screen.getByText('DUE TODAY')).toBeInTheDocument()
  })

  it('should render neutral tone without crash', () => {
    renderWithTheme(<Chip tone="neutral">Neutral</Chip>)
    expect(screen.getByText('Neutral')).toBeInTheDocument()
  })

  it('should render accent tone without crash', () => {
    renderWithTheme(<Chip tone="accent">Accent</Chip>)
    expect(screen.getByText('Accent')).toBeInTheDocument()
  })

  it('should default to neutral tone', () => {
    renderWithTheme(<Chip>Default</Chip>)
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('should render in dark mode', () => {
    renderWithTheme(<Chip tone="accent">Dark chip</Chip>, 'dark')
    expect(screen.getByText('Dark chip')).toBeInTheDocument()
  })
})
