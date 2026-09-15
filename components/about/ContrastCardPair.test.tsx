import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContrastCardPair from './ContrastCardPair'

describe('ContrastCardPair', () => {
  it('renders both cards with their title and body', () => {
    render(
      <ContrastCardPair
        left={{ title: 'Twist', body: 'Twist body text', accentClassName: 'text-primary' }}
        right={{ title: 'Fit', body: 'Fit body text', accentClassName: 'text-secondary' }}
      />
    )
    expect(screen.getByText('Twist')).toBeInTheDocument()
    expect(screen.getByText('Twist body text')).toBeInTheDocument()
    expect(screen.getByText('Fit')).toBeInTheDocument()
    expect(screen.getByText('Fit body text')).toBeInTheDocument()
  })

  it('applies the accent class to each title and the container class when given', () => {
    render(
      <ContrastCardPair
        left={{ title: 'Twist', body: 'Twist body text', accentClassName: 'text-primary' }}
        right={{
          title: 'Fit',
          body: 'Fit body text',
          accentClassName: 'text-secondary',
          containerClassName: 'bg-secondary-container',
        }}
      />
    )
    expect(screen.getByText('Twist')).toHaveClass('text-primary')
    expect(screen.getByText('Fit')).toHaveClass('text-secondary')
    expect(screen.getByText('Fit').closest('div')).toHaveClass('bg-secondary-container')
  })
})
