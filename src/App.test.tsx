import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('should render the Hello Lexio placeholder', () => {
    render(<App />)
    expect(screen.getByText('Hello Lexio')).toBeInTheDocument()
  })

  it('should render the subtitle', () => {
    render(<App />)
    expect(screen.getByText('Your vocabulary trainer')).toBeInTheDocument()
  })
})
