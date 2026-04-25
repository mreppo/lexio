import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import { AboutPage } from './AboutPage'

const darkTheme = createAppTheme('dark')

function renderAboutPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={darkTheme}>
        <AboutPage />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('AboutPage', () => {
  it('should render the main heading', () => {
    renderAboutPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /one person.*zero hand-written code/i,
    )
  })

  it('should render the "How it was built" chip label', () => {
    renderAboutPage()
    expect(screen.getByText(/how it was built/i)).toBeInTheDocument()
  })

  it('should render the AI experiment description', () => {
    renderAboutPage()
    expect(screen.getByText(/autonomous ai agents/i)).toBeInTheDocument()
  })

  it('should render the Product Architect card', () => {
    renderAboutPage()
    expect(screen.getByText(/product architect/i)).toBeInTheDocument()
  })

  it('should render the Agent Team card', () => {
    renderAboutPage()
    expect(screen.getByText(/agent team/i)).toBeInTheDocument()
  })

  it('should render dev stats with labels', () => {
    renderAboutPage()
    // Use getAllByText because "GitHub issues" also appears in the Product Architect card body text
    expect(screen.getAllByText(/github issues/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/prs merged/i)).toBeInTheDocument()
    expect(screen.getByText(/human-written lines/i)).toBeInTheDocument()
  })

  it('should render a "Back to Lexio" navigation link pointing to /', () => {
    renderAboutPage()
    const backLink = screen.getByRole('link', { name: /back to lexio/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/')
  })

  it('should render a GitHub link in the footer', () => {
    renderAboutPage()
    const githubLink = screen.getByRole('link', { name: /github/i })
    expect(githubLink).toBeInTheDocument()
    expect(githubLink).toHaveAttribute('href', 'https://github.com/mreppo/lexio')
  })

  it('should render the zero human-written lines stat', () => {
    renderAboutPage()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
