import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterPill } from './FilterPill'
import { ThemeProvider } from '@mui/material/styles'
import { createAppTheme } from '@/theme'

function renderPill(props: Parameters<typeof FilterPill>[0]) {
  const theme = createAppTheme('light')
  return render(
    <ThemeProvider theme={theme}>
      <FilterPill {...props} />
    </ThemeProvider>,
  )
}

describe('FilterPill', () => {
  it('should render children text', () => {
    renderPill({ active: false, onClick: vi.fn(), children: 'All · 12' })
    expect(screen.getByText('All · 12')).toBeInTheDocument()
  })

  it('should call onClick when tapped', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderPill({ active: false, onClick, children: 'Due · 3' })

    await user.click(screen.getByText('Due · 3'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should have aria-pressed=true when active', () => {
    renderPill({ active: true, onClick: vi.fn(), children: 'Mastered · 5' })
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('should have aria-pressed=false when inactive', () => {
    renderPill({ active: false, onClick: vi.fn(), children: 'Learning · 7' })
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('should use the provided aria-label', () => {
    renderPill({
      active: false,
      onClick: vi.fn(),
      children: 'All · 10',
      'aria-label': 'Filter: All · 10',
    })
    expect(screen.getByRole('button', { name: 'Filter: All · 10' })).toBeInTheDocument()
  })

  it('should render as a button element', () => {
    renderPill({ active: false, onClick: vi.fn(), children: 'Due · 2' })
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
