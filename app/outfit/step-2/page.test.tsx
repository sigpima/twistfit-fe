import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step2Page from './page'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('Step2Page', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the step heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2Page />
      </OutfitFlowProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Bước 2: Chọn Người Mẫu Hoặc Tải Ảnh Cá Nhân' })
    ).toBeInTheDocument()
  })

  it('links back to step 1', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Quay lại Bước 1/ })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('navigates to step 3 after confirming the model', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2Page />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận người mẫu/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-3')
  })
})
