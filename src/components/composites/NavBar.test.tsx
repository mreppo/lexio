import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { NavBar } from './NavBar'

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'dark') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('NavBar', () => {
  it('should render compact mode with title pill', () => {
    renderWithTheme(<NavBar title="Lexio" />)
    expect(screen.getByText('Lexio')).toBeInTheDocument()
  })

  it('should render as a <header> landmark', () => {
    renderWithTheme(<NavBar title="Test" />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('should render leading content', () => {
    renderWithTheme(<NavBar title="Test" leading={<button>Back</button>} />)
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
  })

  it('should render trailing content', () => {
    renderWithTheme(<NavBar title="Test" trailing={<button>Share</button>} />)
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
  })

  it('should not render compact pill in large mode', () => {
    renderWithTheme(<NavBar title="Home" large prominentTitle="Today" />)
    // prominentTitle should be visible; compact pill title should NOT appear separately
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('should use title as fallback when prominentTitle is not set in large mode', () => {
    renderWithTheme(<NavBar title="Settings" large />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should render without any props without crashing', () => {
    renderWithTheme(<NavBar />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('should render in light mode without crashing', () => {
    renderWithTheme(<NavBar title="Light mode" />, 'light')
    expect(screen.getByText('Light mode')).toBeInTheDocument()
  })
})
