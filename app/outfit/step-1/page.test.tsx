import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step1Page from './page'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('Step1Page', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the step heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step1Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Tải lên hoặc Chọn Trang Phục Cần Thử' })).toBeInTheDocument()
  })

  it('links back to the home page', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step1Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Quay lại trang chủ/ })).toHaveAttribute('href', '/')
  })

  it('navigates to step 2 after clicking continue', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step1Page />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục sang Bước 2/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-2')
  })
})
