import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import { LandingPage } from './LandingPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>() // eslint-disable-line @typescript-eslint/consistent-type-imports
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const darkTheme = createAppTheme('dark')

function renderLanding() {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={darkTheme}>
        <LandingPage />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('should render the app name', () => {
    renderLanding()
    expect(screen.getAllByText('Lexio').length).toBeGreaterThan(0)
  })

  it('should render hero tagline', () => {
    renderLanding()
    expect(screen.getByText(/learn vocabulary in any language/i)).toBeInTheDocument()
  })

  it('should render the Try it now CTA button', () => {
    renderLanding()
    expect(screen.getByRole('button', { name: /try it now/i })).toBeInTheDocument()
  })

  it('should render the Set up your own CTA button', () => {
    renderLanding()
    expect(screen.getByRole('button', { name: /set up your own/i })).toBeInTheDocument()
  })

  it('should navigate to /app?demo=true when Try it now is clicked', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: /try it now/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/app?demo=true')
  })

  it('should navigate to /app when Set up your own is clicked', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: /set up your own/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/app')
  })

  it('should render feature highlights section', () => {
    renderLanding()
    expect(screen.getByText(/spaced repetition/i)).toBeInTheDocument()
    expect(screen.getByText(/multiple quiz modes/i)).toBeInTheDocument()
    expect(screen.getByText(/progress and streaks/i)).toBeInTheDocument()
    expect(screen.getByText(/works offline/i)).toBeInTheDocument()
  })

  it('should render the AI story section', () => {
    renderLanding()
    expect(screen.getByText(/one person.*zero hand-written code/i)).toBeInTheDocument()
  })

  it('should render footer with attribution', () => {
    renderLanding()
    expect(screen.getByText(/built with/i)).toBeInTheDocument()
  })

  it('should render GitHub link in footer', () => {
    renderLanding()
    const githubLinks = screen.getAllByRole('link', { name: /github/i })
    expect(githubLinks.length).toBeGreaterThan(0)
  })

  it('should render the h1 heading with accessible role', () => {
    renderLanding()
    // h1 is the app name
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading.textContent).toBe('Lexio')
  })

  it('should render section headings for the feature and AI story sections', () => {
    renderLanding()
    const h2Headings = screen.getAllByRole('heading', { level: 2 })
    expect(h2Headings.length).toBeGreaterThanOrEqual(2)
  })
})
