import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import { StepPagination } from './StepPagination'

const mockTheme = createAppTheme('dark')

function renderPagination(activeStep: number) {
  return render(
    <ThemeProvider theme={mockTheme}>
      <StepPagination activeStep={activeStep} />
    </ThemeProvider>,
  )
}

describe('StepPagination', () => {
  it('should render 3 dots', () => {
    renderPagination(0)
    const dots = screen.getAllByRole('tab')
    expect(dots.length).toBe(3)
  })

  it('should mark the first dot as active when activeStep=0', () => {
    renderPagination(0)
    const dots = screen.getAllByRole('tab')
    expect(dots[0]).toHaveAttribute('aria-selected', 'true')
    expect(dots[1]).toHaveAttribute('aria-selected', 'false')
    expect(dots[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('should mark the second dot as active when activeStep=1', () => {
    renderPagination(1)
    const dots = screen.getAllByRole('tab')
    expect(dots[0]).toHaveAttribute('aria-selected', 'false')
    expect(dots[1]).toHaveAttribute('aria-selected', 'true')
    expect(dots[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('should mark the third dot as active when activeStep=2', () => {
    renderPagination(2)
    const dots = screen.getAllByRole('tab')
    expect(dots[0]).toHaveAttribute('aria-selected', 'false')
    expect(dots[1]).toHaveAttribute('aria-selected', 'false')
    expect(dots[2]).toHaveAttribute('aria-selected', 'true')
  })

  it('should have accessible label "Onboarding progress" on container by default', () => {
    renderPagination(0)
    expect(screen.getByRole('tablist', { name: /onboarding progress/i })).toBeInTheDocument()
  })

  it('should render custom totalSteps when provided', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <StepPagination activeStep={2} totalSteps={4} label="Tutorial slides" />
      </ThemeProvider>,
    )
    expect(screen.getAllByRole('tab').length).toBe(4)
    expect(screen.getByRole('tablist', { name: /tutorial slides/i })).toBeInTheDocument()
  })

  it('should label each dot with its step number', () => {
    renderPagination(0)
    expect(screen.getByRole('tab', { name: /step 1 of 3/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /step 2 of 3/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /step 3 of 3/i })).toBeInTheDocument()
  })
})
