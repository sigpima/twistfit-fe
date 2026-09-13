import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
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

vi.mock('@/lib/getDb', () => ({ getDb: () => ({}) }))
vi.mock('@/lib/capsuleWardrobe', async () => {
  const actual = await vi.importActual<typeof import('@/lib/capsuleWardrobe')>('@/lib/capsuleWardrobe')
  return { ...actual, getCapsuleSets: () => SETS }
})

describe('Step4Page', async () => {
  const { default: Step4Page } = await import('./page')

  it('renders the result heading with capsule sets loaded from the database', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ Ảo AI FitRoom HD' })).toBeInTheDocument()
  })
})
