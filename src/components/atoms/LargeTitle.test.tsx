import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { LargeTitle } from './LargeTitle'

function renderWithTheme(ui: React.ReactNode, mode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('LargeTitle', () => {
  it('should render children as heading', () => {
    renderWithTheme(<LargeTitle>Today</LargeTitle>)
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
  })

  it('should render any text content', () => {
    renderWithTheme(<LargeTitle>Progress</LargeTitle>)
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })

  it('should accept sx overrides', () => {
    renderWithTheme(<LargeTitle sx={{ mt: 2 }}>Settings</LargeTitle>)
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('should render in dark mode', () => {
    renderWithTheme(<LargeTitle>Library</LargeTitle>, 'dark')
    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument()
  })
})
