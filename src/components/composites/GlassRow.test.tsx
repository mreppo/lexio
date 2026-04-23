import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { Settings } from 'lucide-react'
import { createAppTheme } from '../../theme'
import { GlassRow } from './GlassRow'

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'dark') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('GlassRow', () => {
  it('should render the title', () => {
    renderWithTheme(<GlassRow title="Daily goal" />)
    expect(screen.getByText('Daily goal')).toBeInTheDocument()
  })

  it('should render the detail text when provided', () => {
    renderWithTheme(<GlassRow title="Daily goal" detail="20 words" />)
    expect(screen.getByText('20 words')).toBeInTheDocument()
  })

  it('should NOT render detail when omitted', () => {
    renderWithTheme(<GlassRow title="Reminder" />)
    // Detail element should not be present
    expect(screen.queryByText('20 words')).not.toBeInTheDocument()
  })

  it('should render an accessory when provided', () => {
    renderWithTheme(
      <GlassRow title="Sound effects" accessory={<button>Toggle</button>} chevron={false} isLast />,
    )
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument()
  })

  it('should call onClick when the row is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithTheme(<GlassRow title="Export vocabulary" onClick={onClick} />)

    await user.click(screen.getByText('Export vocabulary'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should render without icon when icon is not provided', () => {
    renderWithTheme(<GlassRow title="No icon row" isLast />)
    expect(screen.getByText('No icon row')).toBeInTheDocument()
  })

  it('should render with icon when provided', () => {
    renderWithTheme(<GlassRow title="Settings" icon={Settings} iconBg="#007AFF" />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should render in light mode without crashing', () => {
    renderWithTheme(<GlassRow title="Light mode row" />, 'light')
    expect(screen.getByText('Light mode row')).toBeInTheDocument()
  })

  it('should render with chevron=false without crashing', () => {
    renderWithTheme(<GlassRow title="No chevron" chevron={false} />)
    expect(screen.getByText('No chevron')).toBeInTheDocument()
  })

  it('should render isLast row without crashing', () => {
    renderWithTheme(<GlassRow title="Last row" isLast />)
    expect(screen.getByText('Last row')).toBeInTheDocument()
  })
})
