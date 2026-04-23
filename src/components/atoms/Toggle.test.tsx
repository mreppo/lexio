import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { Toggle } from './Toggle'

function renderWithTheme(ui: React.ReactNode, mode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('Toggle', () => {
  it('should render with role="switch"', () => {
    renderWithTheme(<Toggle on={false} aria-label="Sound effects" />)
    expect(screen.getByRole('switch', { name: 'Sound effects' })).toBeInTheDocument()
  })

  it('should have aria-checked="false" when off', () => {
    renderWithTheme(<Toggle on={false} aria-label="Toggle" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('should have aria-checked="true" when on', () => {
    renderWithTheme(<Toggle on={true} aria-label="Toggle" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('should call onChange when clicked', async () => {
    const handler = vi.fn()
    renderWithTheme(<Toggle on={false} onChange={handler} aria-label="Toggle" />)
    await userEvent.click(screen.getByRole('switch'))
    expect(handler).toHaveBeenCalledWith(true)
  })

  it('should call onChange with false when on and clicked', async () => {
    const handler = vi.fn()
    renderWithTheme(<Toggle on={true} onChange={handler} aria-label="Toggle" />)
    await userEvent.click(screen.getByRole('switch'))
    expect(handler).toHaveBeenCalledWith(false)
  })

  it('should not call onChange when disabled', async () => {
    const handler = vi.fn()
    renderWithTheme(<Toggle on={false} onChange={handler} disabled aria-label="Toggle" />)
    await userEvent.click(screen.getByRole('switch'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('should toggle via Space key', async () => {
    const handler = vi.fn()
    renderWithTheme(<Toggle on={false} onChange={handler} aria-label="Toggle" />)
    const toggle = screen.getByRole('switch')
    toggle.focus()
    await userEvent.keyboard(' ')
    expect(handler).toHaveBeenCalledWith(true)
  })

  it('should toggle via Enter key', async () => {
    const handler = vi.fn()
    renderWithTheme(<Toggle on={false} onChange={handler} aria-label="Toggle" />)
    const toggle = screen.getByRole('switch')
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    expect(handler).toHaveBeenCalledWith(true)
  })

  it('should render in dark mode', () => {
    renderWithTheme(<Toggle on={true} aria-label="Dark toggle" />, 'dark')
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })
})
