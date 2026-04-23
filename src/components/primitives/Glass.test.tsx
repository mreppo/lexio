import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { Glass } from './Glass'

function renderWithTheme(
  ui: React.ReactNode,
  mode: 'light' | 'dark' = 'dark',
): ReturnType<typeof render> {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('Glass', () => {
  it('should render children', () => {
    renderWithTheme(
      <Glass>
        <span>Hello Glass</span>
      </Glass>,
    )
    expect(screen.getByText('Hello Glass')).toBeInTheDocument()
  })

  it('should render with default props (no strong, no floating)', () => {
    const { container } = renderWithTheme(<Glass>content</Glass>)
    expect(container.firstChild).toBeTruthy()
  })

  it('should render with strong prop', () => {
    renderWithTheme(<Glass strong>strong content</Glass>)
    expect(screen.getByText('strong content')).toBeInTheDocument()
  })

  it('should render with floating prop', () => {
    renderWithTheme(<Glass floating>floating content</Glass>)
    expect(screen.getByText('floating content')).toBeInTheDocument()
  })

  it('should render with strong and floating combined', () => {
    renderWithTheme(
      <Glass strong floating>
        combo
      </Glass>,
    )
    expect(screen.getByText('combo')).toBeInTheDocument()
  })

  it('should render with radius preset "card"', () => {
    renderWithTheme(<Glass radius="card">card</Glass>)
    expect(screen.getByText('card')).toBeInTheDocument()
  })

  it('should render with radius preset "btn"', () => {
    renderWithTheme(<Glass radius="btn">btn</Glass>)
    expect(screen.getByText('btn')).toBeInTheDocument()
  })

  it('should render with radius preset "glass"', () => {
    renderWithTheme(<Glass radius="glass">glass</Glass>)
    expect(screen.getByText('glass')).toBeInTheDocument()
  })

  it('should render with radius preset "pill"', () => {
    renderWithTheme(<Glass radius="pill">pill</Glass>)
    expect(screen.getByText('pill')).toBeInTheDocument()
  })

  it('should render with numeric radius', () => {
    renderWithTheme(<Glass radius={8}>eight</Glass>)
    expect(screen.getByText('eight')).toBeInTheDocument()
  })

  it('should render with radius 0', () => {
    renderWithTheme(<Glass radius={0}>zero</Glass>)
    expect(screen.getByText('zero')).toBeInTheDocument()
  })

  it('should render with custom pad', () => {
    renderWithTheme(<Glass pad={24}>padded</Glass>)
    expect(screen.getByText('padded')).toBeInTheDocument()
  })

  it('should render correctly in light mode', () => {
    renderWithTheme(<Glass>light mode</Glass>, 'light')
    expect(screen.getByText('light mode')).toBeInTheDocument()
  })

  it('should render correctly in dark mode', () => {
    renderWithTheme(<Glass>dark mode</Glass>, 'dark')
    expect(screen.getByText('dark mode')).toBeInTheDocument()
  })

  it('should render with a custom component type', () => {
    renderWithTheme(<Glass component="section">section content</Glass>)
    const el = screen.getByText('section content').closest('section')
    expect(el).toBeTruthy()
  })

  it('should apply sx prop styles', () => {
    const { container } = renderWithTheme(<Glass sx={{ width: 200 }}>styled</Glass>)
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByText('styled')).toBeInTheDocument()
  })

  it('should have 3 child nodes (fill, rim, content layers)', () => {
    const { container } = renderWithTheme(<Glass>layers</Glass>)
    // The outer wrapper has 3 children: fill layer, rim layer, content layer
    expect(container.firstChild?.childNodes).toHaveLength(3)
  })

  it('should mark fill and rim layers as aria-hidden', () => {
    const { container } = renderWithTheme(<Glass>a11y</Glass>)
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]')
    // fill layer + rim layer = 2 aria-hidden elements
    expect(hiddenEls).toHaveLength(2)
  })
})
