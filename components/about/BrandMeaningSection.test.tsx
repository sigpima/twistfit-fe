import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BrandMeaningSection from './BrandMeaningSection'

describe('BrandMeaningSection', () => {
  it('renders the name-meaning heading and both contrast cards', () => {
    renderWithIntl(<BrandMeaningSection />)
    expect(screen.getByRole('heading', { name: 'Ý Nghĩa Tên Thương Hiệu' })).toBeInTheDocument()
    expect(screen.getByText('Twist')).toBeInTheDocument()
    expect(screen.getByText('Fit')).toBeInTheDocument()
    expect(screen.getByText(/cú bẻ lái đầy bất ngờ/)).toBeInTheDocument()
    expect(screen.getByText(/vẻ đẹp bền vững không đến từ việc chạy theo xu hướng/)).toBeInTheDocument()
  })

  it('renders the symbol-meaning heading, logo image, and both contrast pairs', () => {
    renderWithIntl(<BrandMeaningSection />)
    expect(screen.getByRole('heading', { name: 'Ý Nghĩa Biểu Tượng TwistFit' })).toBeInTheDocument()
    expect(screen.getByAltText('Logo TwistFit')).toHaveAttribute('src', '/home/logo.png')
    expect(screen.getByText('Tĩnh')).toBeInTheDocument()
    expect(screen.getByText('Động')).toBeInTheDocument()
    expect(screen.getByText('Sắc Vàng Vintage - Trạng Thái Tĩnh')).toBeInTheDocument()
    expect(screen.getByText('Sắc Hồng Hiện Đại - Sự Tái Sinh')).toBeInTheDocument()
  })
})
