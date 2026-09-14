import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step1Page from './page'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

describe('Step1Page', () => {
  beforeEach(() => {
    pushMock.mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse([]))
        if (url.includes('/quiz-attempts/me')) return Promise.resolve(jsonResponse(null))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the step heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step1Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Chọn Trang Phục Cho Buổi Thử Đồ' })).toBeInTheDocument()
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
