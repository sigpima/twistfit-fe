import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, act } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AboutHero from './AboutHero'

describe('AboutHero', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the headline and starts the counter at 100.000+', () => {
    renderWithIntl(<AboutHero />)
    expect(
      screen.getByRole('heading', { level: 1, name: /Định Hình Phong Cách Bằng/ })
    ).toBeInTheDocument()
    expect(screen.getByText('100.000+')).toBeInTheDocument()
  })

  it('animates the counter up to 120.000+ and stops', () => {
    renderWithIntl(<AboutHero />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('120.000+')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('120.000+')).toBeInTheDocument()
  })
})
