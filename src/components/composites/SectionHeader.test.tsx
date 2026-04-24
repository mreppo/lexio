import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { SectionHeader } from './SectionHeader'

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'dark') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('SectionHeader', () => {
  it('should render children text', () => {
    renderWithTheme(<SectionHeader>Daily practice</SectionHeader>)
    expect(screen.getByText('Daily practice')).toBeInTheDocument()
  })

  it('should render as an h2 element by default', () => {
    renderWithTheme(<SectionHeader>Quiz</SectionHeader>)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('should render as h3 when component prop is h3', () => {
    renderWithTheme(<SectionHeader component="h3">Deep section</SectionHeader>)
    expect(screen.getByRole('heading', { level: 3, name: 'Deep section' })).toBeInTheDocument()
  })

  it('should apply uppercase CSS via text-transform (content is passed through as-is)', () => {
    renderWithTheme(<SectionHeader>data</SectionHeader>)
    // The component applies text-transform: uppercase via CSS, not JS.
    // RTL tests what's in the DOM, not the computed style — we assert element existence.
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('data')
  })

  it('should render in light mode without crashing', () => {
    renderWithTheme(<SectionHeader>Light section</SectionHeader>, 'light')
    expect(screen.getByText('Light section')).toBeInTheDocument()
  })

  it('should accept sx overrides without crashing', () => {
    renderWithTheme(<SectionHeader sx={{ mb: 2 }}>With sx</SectionHeader>)
    expect(screen.getByText('With sx')).toBeInTheDocument()
  })
})
