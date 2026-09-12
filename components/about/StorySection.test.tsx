import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StorySection from './StorySection'

describe('StorySection', () => {
  it('renders the brand story narrative and milestones', () => {
    render(<StorySection />)
    expect(screen.getByText('"Tủ Đồ Đầy Ắp Nhưng Không Có Gì Để Mặc"')).toBeInTheDocument()
    expect(screen.getByText('Khởi sinh thuật toán quang phổ da')).toBeInTheDocument()
    expect(screen.getByText('120K+ người dùng tại Việt Nam')).toBeInTheDocument()
  })

  it('renders the story image', () => {
    render(<StorySection />)
    expect(screen.getByAltText(/Phân Tích Draping Vải Truyền Thống/)).toHaveAttribute(
      'src',
      '/about/story-draping.jpg'
    )
  })
})
