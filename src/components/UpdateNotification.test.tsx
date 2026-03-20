import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import { UpdateNotification } from './UpdateNotification'

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={createAppTheme('dark')}>{ui}</ThemeProvider>)
}

describe('UpdateNotification', () => {
  const onUpdate = vi.fn()
  const onDismiss = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render any content when open is false', () => {
    renderWithTheme(<UpdateNotification open={false} onUpdate={onUpdate} onDismiss={onDismiss} />)
    expect(screen.queryByText('New version available')).not.toBeInTheDocument()
  })

  it('should render the notification message when open is true', () => {
    renderWithTheme(<UpdateNotification open={true} onUpdate={onUpdate} onDismiss={onDismiss} />)
    expect(screen.getByText('New version available')).toBeInTheDocument()
  })

  it('should render the Update button when open is true', () => {
    renderWithTheme(<UpdateNotification open={true} onUpdate={onUpdate} onDismiss={onDismiss} />)
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
  })

  it('should render the dismiss button with accessible label', () => {
    renderWithTheme(<UpdateNotification open={true} onUpdate={onUpdate} onDismiss={onDismiss} />)
    expect(screen.getByRole('button', { name: 'Dismiss update notification' })).toBeInTheDocument()
  })

  it('should call onUpdate when the Update button is clicked', async () => {
    const user = userEvent.setup()
    renderWithTheme(<UpdateNotification open={true} onUpdate={onUpdate} onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: 'Update' }))
    expect(onUpdate).toHaveBeenCalledOnce()
  })

  it('should call onDismiss when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    renderWithTheme(<UpdateNotification open={true} onUpdate={onUpdate} onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: 'Dismiss update notification' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('should not call onDismiss when the Update button is clicked', async () => {
    const user = userEvent.setup()
    renderWithTheme(<UpdateNotification open={true} onUpdate={onUpdate} onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: 'Update' }))
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('should not call onUpdate when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    renderWithTheme(<UpdateNotification open={true} onUpdate={onUpdate} onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: 'Dismiss update notification' }))
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
