import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqCategoryPreview from './FaqCategoryPreview'

describe('FaqCategoryPreview', () => {
  it('renders exactly the four FAQ category tiles, each linking to the FAQ page', () => {
    renderWithIntl(<FaqCategoryPreview />)

    expect(screen.getByRole('link', { name: /Tài khoản & Dữ liệu/ })).toHaveAttribute(
      'href',
      '/faq?category=account'
    )
    expect(screen.getByRole('link', { name: /Trắc nghiệm Personal Color/ })).toHaveAttribute(
      'href',
      '/faq?category=personal-color'
    )
    expect(screen.getByRole('link', { name: /Phòng thử đồ ảo \(Fitting Room\)/ })).toHaveAttribute(
      'href',
      '/faq?category=fitting-room'
    )
    expect(screen.getByRole('link', { name: /Chính sách/ })).toHaveAttribute('href', '/faq?category=policy')
  })

  it('renders a link to view all FAQ questions', () => {
    renderWithIntl(<FaqCategoryPreview />)
    expect(screen.getByRole('link', { name: 'Xem tất cả câu hỏi' })).toHaveAttribute('href', '/faq')
  })

  it('renders the section heading', () => {
    renderWithIntl(<FaqCategoryPreview />)
    expect(screen.getByRole('heading', { name: 'Câu Hỏi Thường Gặp' })).toBeInTheDocument()
  })
})
