import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import HeroSlideshow from './HeroSlideshow'

const IMAGES = [
  { src: '/a.jpg', webpSrc: '/a.webp', alt: '' },
  { src: '/b.jpg', webpSrc: '/b.webp', alt: '' },
]

function isVisible(img: Element) {
  return img.className.includes('opacity-100')
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('HeroSlideshow', () => {
  it('shows the first image at full opacity and the rest hidden initially', () => {
    const { container } = render(<HeroSlideshow images={IMAGES} />)
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(2)
    expect(isVisible(imgs[0])).toBe(true)
    expect(isVisible(imgs[1])).toBe(false)
  })

  it('crossfades to the next image after 5 seconds', () => {
    vi.useFakeTimers()
    const { container } = render(<HeroSlideshow images={IMAGES} />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    const imgs = container.querySelectorAll('img')
    expect(isVisible(imgs[0])).toBe(false)
    expect(isVisible(imgs[1])).toBe(true)
  })

  it('does not advance when the user prefers reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    )
    vi.useFakeTimers()
    const { container } = render(<HeroSlideshow images={IMAGES} />)
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    const imgs = container.querySelectorAll('img')
    expect(isVisible(imgs[0])).toBe(true)
  })

  it('renders a single image without crashing when only one image is given', () => {
    const { container } = render(<HeroSlideshow images={[IMAGES[0]]} />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })
})
