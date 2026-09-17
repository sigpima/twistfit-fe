import { describe, expect, it, vi, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/messages/vi.json'
import BlogTableOfContents from './BlogTableOfContents'
import type { HeadingEntry } from '@/lib/markdown'

const HEADINGS: HeadingEntry[] = [
  { id: 'bi-quyet-chon-mau', depth: 2, text: 'Bí quyết chọn màu' },
  { id: 'tong-da-am', depth: 3, text: 'Tông da ấm' },
  { id: 'phu-kien-di-kem', depth: 2, text: 'Phụ kiện đi kèm' },
]

function renderWithHeadingTargets(headings: HeadingEntry[]) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <div>
        {headings.map((heading) => (
          <div key={heading.id} id={heading.id} />
        ))}
        <BlogTableOfContents headings={headings} />
      </div>
    </NextIntlClientProvider>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('BlogTableOfContents', () => {
  it('renders nothing when there are no headings', () => {
    const { container } = renderWithHeadingTargets([])
    expect(container.querySelector('nav')).not.toBeInTheDocument()
  })

  it('renders a link for every heading, indenting h3 entries', () => {
    renderWithHeadingTargets(HEADINGS)
    for (const heading of HEADINGS) {
      expect(screen.getByRole('link', { name: heading.text })).toHaveAttribute('href', `#${heading.id}`)
    }
    expect(screen.getByRole('link', { name: 'Tông da ấm' }).className).toContain('pl-space-lg')
  })

  it('marks the last heading that has scrolled past the reading line as active', () => {
    let capturedCallback: IntersectionObserverCallback = () => {}
    class FakeIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        capturedCallback = callback
      }
      observe = () => {}
      unobserve = () => {}
      disconnect = () => {}
      takeRecords = () => []
    }
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)

    renderWithHeadingTargets(HEADINGS)

    // Simulate scroll position: the first two headings have already scrolled
    // past the reading line, the third one hasn't reached it yet.
    vi.spyOn(document.getElementById('bi-quyet-chon-mau')!, 'getBoundingClientRect').mockReturnValue({
      top: -400,
    } as DOMRect)
    vi.spyOn(document.getElementById('tong-da-am')!, 'getBoundingClientRect').mockReturnValue({
      top: 20,
    } as DOMRect)
    vi.spyOn(document.getElementById('phu-kien-di-kem')!, 'getBoundingClientRect').mockReturnValue({
      top: 800,
    } as DOMRect)

    act(() => {
      capturedCallback([], {} as IntersectionObserver)
    })

    expect(screen.getByRole('link', { name: 'Tông da ấm' })).toHaveAttribute('aria-current', 'location')
    expect(screen.getByRole('link', { name: 'Bí quyết chọn màu' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Phụ kiện đi kèm' })).not.toHaveAttribute('aria-current')
  })

  it('keeps the last heading active once the reader has scrolled past all of them', () => {
    let capturedCallback: IntersectionObserverCallback = () => {}
    class FakeIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        capturedCallback = callback
      }
      observe = () => {}
      unobserve = () => {}
      disconnect = () => {}
      takeRecords = () => []
    }
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)

    renderWithHeadingTargets(HEADINGS)

    for (const heading of HEADINGS) {
      vi.spyOn(document.getElementById(heading.id)!, 'getBoundingClientRect').mockReturnValue({
        top: -900,
      } as DOMRect)
    }

    act(() => {
      capturedCallback([], {} as IntersectionObserver)
    })

    expect(screen.getByRole('link', { name: 'Phụ kiện đi kèm' })).toHaveAttribute('aria-current', 'location')
  })
})
