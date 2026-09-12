import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step3Page from './page'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('Step3Page', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the step heading', () => {
    render(
      <OutfitFlowProvider>
        <Step3Page />
      </OutfitFlowProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Bước 3: Chọn Tư Thế & Điều Chỉnh Tỷ Lệ Vóc Dáng' })
    ).toBeInTheDocument()
  })

  it('links back to step 2', () => {
    render(
      <OutfitFlowProvider>
        <Step3Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('button', { name: /Quay lại Bước 2/ })).toBeInTheDocument()
  })

  it('navigates to step 4 after generating', () => {
    render(
      <OutfitFlowProvider>
        <Step3Page />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Tạo Đồ Ảo Ngay/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-4')
  })
})
