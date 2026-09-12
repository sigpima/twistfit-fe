import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Step2Page from './page'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('Step2Page', () => {
  beforeEach(() => {
    pushMock.mockClear()
    vi.useFakeTimers()
  })

  it('renders the stepper on step 2 and the step heading', () => {
    render(
      <OutfitFlowProvider>
        <Step2Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Bước 2 · Đang chọn')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Bước 2: Chọn Người Mẫu Hoặc Tải Ảnh Cá Nhân' })
    ).toBeInTheDocument()
  })

  it('links back to step 1', () => {
    render(
      <OutfitFlowProvider>
        <Step2Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Quay lại Bước 1/ })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('navigates to step 3 after confirming the model', () => {
    render(
      <OutfitFlowProvider>
        <Step2Page />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận người mẫu/ }))
    act(() => {
      vi.runAllTimers()
    })
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-3')
  })
})
