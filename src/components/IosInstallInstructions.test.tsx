import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import { IosInstallInstructions } from './IosInstallInstructions'

const theme = createAppTheme('dark')

function renderDialog(open: boolean, onClose = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <IosInstallInstructions open={open} onClose={onClose} />
    </ThemeProvider>,
  )
}

describe('IosInstallInstructions', () => {
  it('should render the dialog when open', () => {
    renderDialog(true)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should not render the dialog when closed', () => {
    renderDialog(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should show all three installation steps', () => {
    renderDialog(true)
    expect(screen.getByText(/tap the share button/i)).toBeInTheDocument()
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument()
    expect(screen.getByText(/tap "add"/i)).toBeInTheDocument()
  })

  it('should render the "Got it" close button', () => {
    renderDialog(true)
    expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument()
  })

  it('should call onClose when "Got it" is clicked', () => {
    const onClose = vi.fn()
    renderDialog(true, onClose)

    fireEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should display the dialog title with "Install Lexio"', () => {
    renderDialog(true)
    expect(screen.getByText(/install lexio/i)).toBeInTheDocument()
  })
})
