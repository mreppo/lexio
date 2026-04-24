import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { BigWord } from './BigWord'

function renderWithTheme(ui: React.ReactNode, mode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('BigWord', () => {
  it('should render children', () => {
    renderWithTheme(<BigWord>efímero</BigWord>)
    expect(screen.getByText('efímero')).toBeInTheDocument()
  })

  it('should default to a non-heading span element', () => {
    renderWithTheme(<BigWord>efímero</BigWord>)
    // Default component is 'span' — not a heading
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('should render as h1 when component prop is h1', () => {
    renderWithTheme(<BigWord component="h1">ābols</BigWord>)
    expect(screen.getByRole('heading', { level: 1, name: 'ābols' })).toBeInTheDocument()
  })

  it('should render a number', () => {
    renderWithTheme(<BigWord>14</BigWord>)
    expect(screen.getByText('14')).toBeInTheDocument()
  })

  it('should accept size prop', () => {
    renderWithTheme(<BigWord size={72}>Big</BigWord>)
    expect(screen.getByText('Big')).toBeInTheDocument()
  })

  it('should accept weight prop', () => {
    renderWithTheme(<BigWord weight={700}>Weighted</BigWord>)
    expect(screen.getByText('Weighted')).toBeInTheDocument()
  })

  it('should accept color prop', () => {
    renderWithTheme(<BigWord color="#FF0000">Red</BigWord>)
    expect(screen.getByText('Red')).toBeInTheDocument()
  })

  it('should render in dark mode', () => {
    renderWithTheme(<BigWord>Dark word</BigWord>, 'dark')
    expect(screen.getByText('Dark word')).toBeInTheDocument()
  })

  it('should render small size (< 40) without crash', () => {
    renderWithTheme(
      <BigWord size={24} weight={700}>
        24
      </BigWord>,
    )
    expect(screen.getByText('24')).toBeInTheDocument()
  })
})
