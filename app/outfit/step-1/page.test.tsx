import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Step1Page from './page'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('Step1Page', () => {
  beforeEach(() => {
    pushMock.mockClear()
    vi.useFakeTimers()
  })

  it('renders the stepper on step 1 and the step heading', () => {
    render(
      <OutfitFlowProvider>
        <Step1Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Bước 1 · Đang chọn')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tải lên hoặc Chọn Trang Phục Cần Thử' })).toBeInTheDocument()
  })

  it('links back to the home page', () => {
    render(
      <OutfitFlowProvider>
        <Step1Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Quay lại trang chủ/ })).toHaveAttribute('href', '/')
  })

  it('navigates to step 2 after clicking continue', () => {
    render(
      <OutfitFlowProvider>
        <Step1Page />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục sang Bước 2/ }))
    act(() => {
      vi.runAllTimers()
    })
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-2')
  })
})
