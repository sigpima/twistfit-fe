import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OutfitFlowProvider } from './OutfitFlowProvider'
import OutfitFlowChrome from './OutfitFlowChrome'

let mockPathname = '/outfit/step-1'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

describe('OutfitFlowChrome', () => {
  it('derives the current step from the pathname and renders children', () => {
    mockPathname = '/outfit/step-2'
    render(
      <OutfitFlowProvider>
        <OutfitFlowChrome>
          <p>Step 2 content</p>
        </OutfitFlowChrome>
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Bước 2 · Đang chọn')).toBeInTheDocument()
    expect(screen.getByText('Step 2 content')).toBeInTheDocument()
  })

  it('keeps steps already visited ahead of the current one clickable after navigating back', () => {
    mockPathname = '/outfit/step-1'
    const { rerender } = render(
      <OutfitFlowProvider>
        <OutfitFlowChrome>
          <p>content</p>
        </OutfitFlowChrome>
      </OutfitFlowProvider>
    )

    mockPathname = '/outfit/step-3'
    rerender(
      <OutfitFlowProvider>
        <OutfitFlowChrome>
          <p>content</p>
        </OutfitFlowChrome>
      </OutfitFlowProvider>
    )

    mockPathname = '/outfit/step-1'
    rerender(
      <OutfitFlowProvider>
        <OutfitFlowChrome>
          <p>content</p>
        </OutfitFlowChrome>
      </OutfitFlowProvider>
    )

    expect(screen.getByRole('link', { name: /Tư Thế & Góc Nhìn/ })).toHaveAttribute('href', '/outfit/step-3')
  })
})
