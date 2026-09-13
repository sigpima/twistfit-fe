import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import CapsuleWardrobe from './CapsuleWardrobe'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

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
  {
    id: 2,
    image: '/outfit/capsule-set-date.jpg',
    alt: 'Ảnh set 2',
    tagVariant: 'secondary',
    tagLabel: 'Set 2 • Dạo Phố',
    fitFor: 'Phù hợp: Dating & Weekend',
    title: 'Hẹn Hò & Dạo Phố',
    tone: 'Soft Silver',
    description: 'Mô tả set 2',
    items: [{ label: 'Chân váy midi xám bạc:', price: '530.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 3,
    image: '/outfit/capsule-set-accessories.jpg',
    alt: 'Ảnh set 3',
    tagVariant: 'tertiary',
    tagLabel: 'Set 3 • Điểm Nhấn',
    fitFor: 'Phù hợp: Điểm Nhấn Cao Cấp',
    title: 'Phụ Kiện Tối Ưu',
    tone: 'Pastel Lilac',
    description: 'Mô tả set 3',
    items: [{ label: 'Khuyên tai bạc Ý 925:', price: '320.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('CapsuleWardrobe', () => {
  it('renders every set passed in', () => {
    renderWithIntl(<CapsuleWardrobe sets={SETS} />)
    expect(screen.getByText('Thanh Lịch Công Sở')).toBeInTheDocument()
    expect(screen.getByText('Hẹn Hò & Dạo Phố')).toBeInTheDocument()
    expect(screen.getByText('Phụ Kiện Tối Ưu')).toBeInTheDocument()
  })

  it('renders each set’s line items with price', () => {
    renderWithIntl(<CapsuleWardrobe sets={SETS} />)
    expect(screen.getByText('Quần ống suông ngà:')).toBeInTheDocument()
    expect(screen.getByText('490.000 ₫')).toBeInTheDocument()
  })

  it('links to the personal color quiz', () => {
    renderWithIntl(<CapsuleWardrobe sets={SETS} />)
    expect(screen.getByRole('link', { name: 'Làm Bài Test Personal Color' })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
  })
})
