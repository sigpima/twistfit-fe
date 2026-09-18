import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhoneMockupStepper from './PhoneMockupStepper'

const IMAGES = [
  { key: 'a', src: '/a.jpg', alt: 'A', bg: '/a-bg.jpg' },
  { key: 'b', src: '/b.jpg', alt: 'B', bg: '/b-bg.jpg' },
  { key: 'c', src: '/c.jpg', alt: 'C', bg: '/c-bg.jpg' },
]

describe('PhoneMockupStepper', () => {
  it('shows the image at activeIndex', () => {
    render(<PhoneMockupStepper images={IMAGES} activeIndex={1} onSelect={vi.fn()} />)
    expect(screen.getByAltText('B')).toBeInTheDocument()
  })

  it('shows the background image matching activeIndex', () => {
    render(<PhoneMockupStepper images={IMAGES} activeIndex={1} onSelect={vi.fn()} />)
    expect(screen.getByAltText('B')).toBeInTheDocument()
    const bgImage = document.querySelector('img[src="/b-bg.jpg"]')
    expect(bgImage).toBeInTheDocument()
  })

  it('renders one step button per image', () => {
    render(<PhoneMockupStepper images={IMAGES} activeIndex={0} onSelect={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('calls onSelect with the clicked step index', () => {
    const onSelect = vi.fn()
    render(<PhoneMockupStepper images={IMAGES} activeIndex={0} onSelect={onSelect} />)
    fireEvent.click(screen.getAllByRole('button')[2])
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('marks only the active step button with aria-current', () => {
    render(<PhoneMockupStepper images={IMAGES} activeIndex={1} onSelect={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[1]).toHaveAttribute('aria-current', 'step')
    expect(buttons[0]).not.toHaveAttribute('aria-current')
    expect(buttons[2]).not.toHaveAttribute('aria-current')
  })
})
