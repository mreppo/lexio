import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import { InstallBanner } from './InstallBanner'
import type { InstallPlatform } from '../hooks/useInstallPrompt'

const theme = createAppTheme('dark')

function renderBanner(
  props: Partial<{
    open: boolean
    platform: InstallPlatform
    onInstall: () => Promise<void>
    onDismiss: () => void
  }> = {},
) {
  const defaultProps = {
    open: true,
    platform: 'other' as InstallPlatform,
    onInstall: vi.fn().mockResolvedValue(undefined),
    onDismiss: vi.fn(),
    ...props,
  }
  return render(
    <ThemeProvider theme={theme}>
      <InstallBanner {...defaultProps} />
    </ThemeProvider>,
  )
}

describe('InstallBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the banner message when open', () => {
    renderBanner({ open: true })
    expect(screen.getByText(/install lexio for quick access/i)).toBeInTheDocument()
  })

  it('should not render the banner message when closed', () => {
    renderBanner({ open: false })
    // MUI Snackbar removes content from the DOM when closed (no keepMounted)
    expect(screen.queryByText(/install lexio for quick access/i)).not.toBeInTheDocument()
  })

  it('should render an Install button inside the banner region', () => {
    renderBanner({ open: true })
    const region = screen.getByRole('region', { name: /install lexio/i })
    const installBtn = region.querySelector('button[class*="MuiButton"]')
    expect(installBtn).toBeInTheDocument()
    expect(installBtn).toHaveTextContent(/install/i)
  })

  it('should render a dismiss button', () => {
    renderBanner({ open: true })
    expect(screen.getByRole('button', { name: /dismiss install banner/i })).toBeInTheDocument()
  })

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    renderBanner({ open: true, onDismiss })

    fireEvent.click(screen.getByRole('button', { name: /dismiss install banner/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('should call onInstall when Install is clicked on non-iOS platform', () => {
    const onInstall = vi.fn().mockResolvedValue(undefined)
    renderBanner({ open: true, platform: 'android-chrome', onInstall })

    const region = screen.getByRole('region', { name: /install lexio/i })
    const installBtn = region.querySelector('button[class*="MuiButton"]') as HTMLElement
    fireEvent.click(installBtn)
    expect(onInstall).toHaveBeenCalledOnce()
  })

  it('should open iOS instructions modal instead of calling onInstall on ios-safari', () => {
    const onInstall = vi.fn().mockResolvedValue(undefined)
    renderBanner({ open: true, platform: 'ios-safari', onInstall })

    const region = screen.getByRole('region', { name: /install lexio/i })
    const installBtn = region.querySelector('button[class*="MuiButton"]') as HTMLElement
    fireEvent.click(installBtn)

    // onInstall should NOT be called on iOS
    expect(onInstall).not.toHaveBeenCalled()
    // The iOS instructions dialog should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument()
  })

  it('should close iOS instructions modal and call onDismiss when "Got it" is clicked', () => {
    const onDismiss = vi.fn()
    renderBanner({ open: true, platform: 'ios-safari', onDismiss })

    const region = screen.getByRole('region', { name: /install lexio/i })
    const installBtn = region.querySelector('button[class*="MuiButton"]') as HTMLElement
    fireEvent.click(installBtn)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Close via "Got it"
    fireEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
