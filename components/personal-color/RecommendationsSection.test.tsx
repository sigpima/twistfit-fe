import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import RecommendationsSection from './RecommendationsSection'

describe('RecommendationsSection', () => {
  it('renders the heading and the real recommendation text for the given sub-season', () => {
    renderWithIntl(<RecommendationsSection subSeason="true-winter" />)
    expect(screen.getByText('Gợi ý ứng dụng')).toBeInTheDocument()
    expect(screen.getByText('Đỏ tươi, hồng fuchsia')).toBeInTheDocument()
    expect(screen.getByText('Áo trắng phối đen, đầm xanh hoàng gia')).toBeInTheDocument()
  })
})
