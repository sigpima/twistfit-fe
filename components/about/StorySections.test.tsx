import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import StorySections from './StorySections'

describe('StorySections', () => {
  it('renders all four chapter headings in order', () => {
    renderWithIntl(<StorySections />)
    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings).toEqual(['Câu chuyện thương hiệu', 'Ý nghĩa thương hiệu', 'Sứ mệnh', 'Tầm nhìn tương lai'])
  })

  it('renders the mission subheading and quote', () => {
    renderWithIntl(<StorySections />)
    expect(screen.getByText('Hiểu rõ chính mình, làm chủ phong cách')).toBeInTheDocument()
    expect(
      screen.getByText(/Mặc đẹp thực chất không bắt đầu từ việc sắm thêm một món đồ mới/)
    ).toBeInTheDocument()
  })

  it('renders the vision quote', () => {
    renderWithIntl(<StorySections />)
    expect(screen.getByText(/Hệ sinh thái thời trang số dẫn đầu giới trẻ Việt/)).toBeInTheDocument()
  })

  it('renders each chapter image with the matching source', () => {
    renderWithIntl(<StorySections />)
    expect(screen.getByAltText('Minh họa câu chuyện thương hiệu TwistFit')).toHaveAttribute(
      'src',
      '/about/story.png'
    )
    expect(screen.getByAltText('Minh họa ý nghĩa thương hiệu TwistFit')).toHaveAttribute(
      'src',
      '/about/brand-meaning.png'
    )
    expect(screen.getByAltText('Minh họa sứ mệnh của TwistFit')).toHaveAttribute('src', '/about/mission.png')
    expect(screen.getByAltText('Minh họa tầm nhìn tương lai của TwistFit')).toHaveAttribute(
      'src',
      '/about/vision.png'
    )
  })
})
