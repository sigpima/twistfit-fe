import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// jsdom implements neither getClientRects nor getBoundingClientRect on
// Element or Range — ProseMirror's editor view (used by the TipTap-based
// RichTextEditor) calls range.getClientRects() while scrolling a
// newly-inserted node into view, throwing an unhandled exception in test
// runs otherwise. Range is the actual caller (see prosemirror-view's
// singleRect/textRange), not Element, so both need the polyfill, and neither
// can delegate to the other since both are missing.
const zeroRect = (): DOMRect =>
  ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect

for (const proto of [Element.prototype, Range.prototype] as unknown as Array<{
  getBoundingClientRect: () => DOMRect
  getClientRects: () => DOMRectList
}>) {
  if (!proto.getBoundingClientRect) {
    proto.getBoundingClientRect = zeroRect
  }
  if (!proto.getClientRects) {
    proto.getClientRects = () => [] as unknown as DOMRectList
  }
}

if (!window.IntersectionObserver) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: ReadonlyArray<number> = []
    constructor(public callback: IntersectionObserverCallback) {}
    observe = () => {}
    unobserve = () => {}
    disconnect = () => {}
    takeRecords = (): IntersectionObserverEntry[] => []
  }
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
}

afterEach(() => {
  cleanup()
})
