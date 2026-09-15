import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import StorySection from './StorySection'

describe('StorySection', () => {
  it('renders the brand story narrative', () => {
    renderWithIntl(<StorySection />)
    expect(screen.getByRole('heading', { name: 'Câu Chuyện Thương Hiệu' })).toBeInTheDocument()
    expect(screen.getByText(/tủ đồ đầy ngập của bạn Minh Ánh/)).toBeInTheDocument()
    expect(screen.getByText(/trăn trở chung của rất nhiều người trẻ/)).toBeInTheDocument()
  })

  it('no longer renders the removed milestones or AI-core panel', () => {
    renderWithIntl(<StorySection />)
    expect(screen.queryByText('Khởi sinh thuật toán quang phổ da')).not.toBeInTheDocument()
    expect(screen.queryByText('120K+ người dùng tại Việt Nam')).not.toBeInTheDocument()
    expect(screen.queryByText(/TwistFit AI Camera Core/)).not.toBeInTheDocument()
  })

  it('renders the story image', () => {
    renderWithIntl(<StorySection />)
    expect(screen.getByAltText(/Phân Tích Draping Vải Truyền Thống/)).toHaveAttribute(
      'src',
      '/about/story-draping.jpg'
    )
  })
})
