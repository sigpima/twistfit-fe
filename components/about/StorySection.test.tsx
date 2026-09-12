import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import StorySection from './StorySection'

describe('StorySection', () => {
  it('renders the brand story narrative and milestones', () => {
    renderWithIntl(<StorySection />)
    expect(screen.getByText('"Tủ Đồ Đầy Ắp Nhưng Không Có Gì Để Mặc"')).toBeInTheDocument()
    expect(screen.getByText('Khởi sinh thuật toán quang phổ da')).toBeInTheDocument()
    expect(screen.getByText('120K+ người dùng tại Việt Nam')).toBeInTheDocument()
  })

  it('renders the story image', () => {
    renderWithIntl(<StorySection />)
    expect(screen.getByAltText(/Phân Tích Draping Vải Truyền Thống/)).toHaveAttribute(
      'src',
      '/about/story-draping.jpg'
    )
  })
})
