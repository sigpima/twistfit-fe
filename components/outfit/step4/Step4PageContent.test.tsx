import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step4PageContent from './Step4PageContent'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('Step4PageContent', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the result heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ' })).toBeInTheDocument()
  })

  it('starts a new outfit at step 1 when clicking Phối Đồ Mới', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Phối Đồ Mới/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-1')
  })
})
