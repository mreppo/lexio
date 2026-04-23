import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { Btn } from './Btn'

function renderWithTheme(ui: React.ReactNode, mode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('Btn', () => {
  it('should render with role="button"', () => {
    renderWithTheme(<Btn>Click me</Btn>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('should render filled kind', () => {
    renderWithTheme(<Btn kind="filled">Filled</Btn>)
    expect(screen.getByRole('button', { name: 'Filled' })).toBeInTheDocument()
  })

  it('should render white kind', () => {
    renderWithTheme(<Btn kind="white">White</Btn>)
    expect(screen.getByRole('button', { name: 'White' })).toBeInTheDocument()
  })

  it('should render glass kind', () => {
    renderWithTheme(<Btn kind="glass">Glass</Btn>)
    expect(screen.getByRole('button', { name: 'Glass' })).toBeInTheDocument()
  })

  it('should render sm size', () => {
    renderWithTheme(
      <Btn size="sm" kind="filled">
        Small
      </Btn>,
    )
    expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument()
  })

  it('should render md size', () => {
    renderWithTheme(
      <Btn size="md" kind="filled">
        Medium
      </Btn>,
    )
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument()
  })

  it('should render lg size', () => {
    renderWithTheme(
      <Btn size="lg" kind="filled">
        Large
      </Btn>,
    )
    expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument()
  })

  it('should fire onClick when clicked', async () => {
    const handler = vi.fn()
    renderWithTheme(
      <Btn kind="filled" onClick={handler}>
        Click
      </Btn>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Click' }))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('should be disabled when disabled prop is set', () => {
    renderWithTheme(
      <Btn kind="filled" disabled>
        Disabled
      </Btn>,
    )
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })

  it('should use aria-label when provided', () => {
    renderWithTheme(
      <Btn kind="filled" aria-label="Custom label">
        X
      </Btn>,
    )
    expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument()
  })

  it('should render in dark mode without error', () => {
    renderWithTheme(<Btn kind="glass">Dark</Btn>, 'dark')
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument()
  })

  it('should render full-width when full prop is set', () => {
    const { container } = renderWithTheme(
      <Btn kind="glass" full>
        Full
      </Btn>,
    )
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Full' })).toBeInTheDocument()
  })
})
