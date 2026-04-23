/**
 * Tests for the TabTransition component.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TabTransition } from './TabTransition'
import type { AppTab } from './composites'

describe('TabTransition', () => {
  it('should render children', () => {
    render(
      <TabTransition activeTab={'home' as AppTab}>
        <div>Tab content</div>
      </TabTransition>,
    )
    expect(screen.getByText('Tab content')).toBeInTheDocument()
  })

  it('should render a Box wrapper around children', () => {
    const { container } = render(
      <TabTransition activeTab={'quiz' as AppTab}>
        <p>Quiz content</p>
      </TabTransition>,
    )
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByText('Quiz content')).toBeInTheDocument()
  })

  it('should render different tab content when activeTab changes', () => {
    const { rerender } = render(
      <TabTransition activeTab={'home' as AppTab}>
        <div>Home content</div>
      </TabTransition>,
    )
    expect(screen.getByText('Home content')).toBeInTheDocument()

    rerender(
      <TabTransition activeTab={'quiz' as AppTab}>
        <div>Quiz content</div>
      </TabTransition>,
    )
    expect(screen.getByText('Quiz content')).toBeInTheDocument()
  })
})
