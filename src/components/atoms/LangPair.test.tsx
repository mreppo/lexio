import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { LangPair } from './LangPair'

function renderWithTheme(ui: React.ReactNode, mode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('LangPair', () => {
  it('should render both language codes', () => {
    renderWithTheme(<LangPair from="ES" to="EN" />)
    expect(screen.getByText('ES')).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('should render with different language codes', () => {
    renderWithTheme(<LangPair from="LV" to="DE" />)
    expect(screen.getByText('LV')).toBeInTheDocument()
    expect(screen.getByText('DE')).toBeInTheDocument()
  })

  it('should render in dark mode', () => {
    renderWithTheme(<LangPair from="FR" to="EN" />, 'dark')
    expect(screen.getByText('FR')).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })
})
