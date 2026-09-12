import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step4Page from './page'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('Step4Page', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the result heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ Ảo AI FitRoom HD' })).toBeInTheDocument()
  })

  it('restarts the flow at step 1 when clicking Làm Mới', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4Page />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Làm Mới/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-1')
  })

  it('links to the capsule wardrobe section', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Gợi ý Capsule Phối Đồ/ })).toHaveAttribute(
      'href',
      '#capsule-wardrobe'
    )
  })
})
