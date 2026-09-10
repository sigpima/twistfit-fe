import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders a single link to /camera-frame', () => {
    render(<HomePage />)
    const link = screen.getByRole('link', { name: 'Thử tính năng Camera Frame' })
    expect(link).toHaveAttribute('href', '/camera-frame')
  })
})
