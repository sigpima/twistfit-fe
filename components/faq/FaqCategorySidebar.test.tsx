import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqCategorySidebar from './FaqCategorySidebar'

describe('FaqCategorySidebar', () => {
  it('renders the "all" tile plus every FAQ category', () => {
    renderWithIntl(<FaqCategorySidebar active="all" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Tất cả' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tài khoản & Dữ liệu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trắc nghiệm Personal Color' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phòng thử đồ ảo (Fitting Room)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chính sách' })).toBeInTheDocument()
  })

  it('marks the active category as pressed', () => {
    renderWithIntl(<FaqCategorySidebar active="fitting-room" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Phòng thử đồ ảo (Fitting Room)' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the clicked category id', () => {
    const onChange = vi.fn()
    renderWithIntl(<FaqCategorySidebar active="all" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Chính sách' }))
    expect(onChange).toHaveBeenCalledWith('policy')
  })
})
