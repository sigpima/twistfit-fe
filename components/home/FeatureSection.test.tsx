import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FeatureSection from './FeatureSection'

describe('FeatureSection', () => {
  it('renders the feature title and the CTA', () => {
    renderWithIntl(<FeatureSection featureKey="colorTest" accentClassName="text-secondary" cta={{ label: 'Kiểm Tra Ngay', onClick: vi.fn() }} />)
    expect(screen.getByRole('heading', { name: 'Màu sắc cá nhân' })).toBeInTheDocument()
    expect(screen.getByText('Kiểm Tra Ngay')).toBeInTheDocument()
  })

  it('shows the first step title/body by default', () => {
    renderWithIntl(<FeatureSection featureKey="colorTest" accentClassName="text-secondary" cta={{ label: 'Kiểm Tra Ngay', onClick: vi.fn() }} />)
    expect(screen.getAllByText('Khám phá sắc độ qua bài kiểm tra nhanh.').length).toBeGreaterThan(0)
  })

  it('switches the active step when a desktop step card is clicked', () => {
    renderWithIntl(<FeatureSection featureKey="colorTest" accentClassName="text-secondary" cta={{ label: 'Kiểm Tra Ngay', onClick: vi.fn() }} />)
    fireEvent.click(screen.getByText('Mở khóa cẩm nang màu sắc cá nhân.'))
    const stepButtons = screen.getAllByRole('button', { name: '2' })
    expect(stepButtons[0]).toHaveAttribute('aria-current', 'step')
  })

  it('calls the CTA onClick handler when clicked', () => {
    const onClick = vi.fn()
    renderWithIntl(<FeatureSection featureKey="colorTest" accentClassName="text-secondary" cta={{ label: 'Kiểm Tra Ngay', onClick }} />)
    fireEvent.click(screen.getByText('Kiểm Tra Ngay'))
    expect(onClick).toHaveBeenCalled()
  })

  it('renders the CTA as a link when href is given instead of onClick', () => {
    renderWithIntl(<FeatureSection featureKey="outfit" accentClassName="text-primary" cta={{ label: 'Bắt Đầu Phối Đồ Ngay', href: '/outfit/step-1' }} />)
    expect(screen.getByRole('link', { name: 'Bắt Đầu Phối Đồ Ngay' })).toHaveAttribute('href', '/outfit/step-1')
  })
})
