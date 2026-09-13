import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step4PageContent from './Step4PageContent'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const SETS: CapsuleSet[] = [
  {
    id: 1,
    image: '/outfit/capsule-set-office.jpg',
    alt: 'Ảnh set 1',
    tagVariant: 'primary',
    tagLabel: 'Set 1 • Thanh Lịch',
    fitFor: 'Phù hợp: Office & Meeting',
    title: 'Thanh Lịch Công Sở',
    tone: 'Warm Cream',
    description: 'Mô tả set 1',
    items: [{ label: 'Quần ống suông ngà:', price: '490.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('Step4PageContent', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the result heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent capsuleSets={SETS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ Ảo AI FitRoom HD' })).toBeInTheDocument()
  })

  it('restarts the flow at step 1 when clicking Làm Mới', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent capsuleSets={SETS} />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Làm Mới/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-1')
  })

  it('links to the capsule wardrobe section', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent capsuleSets={SETS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Gợi ý Capsule Phối Đồ/ })).toHaveAttribute(
      'href',
      '#capsule-wardrobe'
    )
  })
})
