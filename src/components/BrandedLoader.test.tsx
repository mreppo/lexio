/**
 * Tests for the BrandedLoader component.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandedLoader } from './BrandedLoader'
import { createAppTheme } from '@/theme'
import { ThemeProvider } from '@mui/material'

function renderWithTheme(ui: React.ReactElement) {
  const theme = createAppTheme('dark')
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

describe('BrandedLoader', () => {
  it('should render with a default accessible label', () => {
    renderWithTheme(<BrandedLoader />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('should render with a custom label', () => {
    renderWithTheme(<BrandedLoader label="Loading Lexio" />)
    expect(screen.getByRole('status', { name: 'Loading Lexio' })).toBeInTheDocument()
  })

  it('should not show wordmark by default', () => {
    renderWithTheme(<BrandedLoader />)
    expect(screen.queryByText('LEXIO')).not.toBeInTheDocument()
  })

  it('should show wordmark when showWordmark is true', () => {
    renderWithTheme(<BrandedLoader showWordmark />)
    expect(screen.getByText('LEXIO')).toBeInTheDocument()
  })
})
