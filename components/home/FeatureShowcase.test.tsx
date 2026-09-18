import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FeatureShowcase from './FeatureShowcase'

function renderShowcase() {
  return renderWithIntl(<FeatureShowcase />)
}

describe('FeatureShowcase', () => {
  it('shows only the first feature by default', () => {
    renderShowcase()
    expect(screen.getByRole('heading', { name: 'Màu sắc cá nhân' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Phối đồ' })).not.toBeInTheDocument()
  })

  it('links the Personal Color CTA to the quiz page', () => {
    renderShowcase()
    expect(screen.getByRole('link', { name: 'Kiểm Tra Ngay' })).toHaveAttribute('href', '/personal-color/quiz')
  })

  it('advances to the next feature when the next arrow is clicked', () => {
    renderShowcase()
    fireEvent.click(screen.getByRole('button', { name: 'Xem tính năng tiếp theo' }))
    expect(screen.getByRole('heading', { name: 'Phối đồ' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bắt Đầu Phối Đồ Ngay' })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('wraps around from the last feature back to the first', () => {
    renderShowcase()
    fireEvent.click(screen.getByRole('button', { name: 'Xem tính năng tiếp theo' }))
    expect(screen.getByRole('heading', { name: 'Phối đồ' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Xem tính năng tiếp theo' }))
    expect(screen.getByRole('heading', { name: 'Màu sắc cá nhân' })).toBeInTheDocument()
  })

  it('wraps around from the first feature back to the last with the previous arrow', () => {
    renderShowcase()
    fireEvent.click(screen.getByRole('button', { name: 'Xem tính năng trước' }))
    expect(screen.getByRole('heading', { name: 'Phối đồ' })).toBeInTheDocument()
  })

  it('jumps directly to a feature when its dot is clicked', () => {
    renderShowcase()
    fireEvent.click(screen.getByRole('button', { name: 'Xem tính năng: Phối đồ' }))
    expect(screen.getByRole('heading', { name: 'Phối đồ' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xem tính năng: Phối đồ' })).toHaveAttribute('aria-current', 'true')
  })
})
