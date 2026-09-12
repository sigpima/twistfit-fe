import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultPage from './page'

describe('ResultPage', () => {
  it('renders the page heading and breadcrumbs', () => {
    render(<ResultPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'KẾT QUẢ PHÂN TÍCH PERSONAL COLOR' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Kiểm tra Personal Color' })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
  })

  it('composes the profile card and insights sections', () => {
    render(<ResultPage />)
    expect(screen.getByRole('heading', { level: 3, name: 'Mùa Đông (Winter)' })).toBeInTheDocument()
    expect(screen.getByText('Chi tiết các chỉ số màu sắc')).toBeInTheDocument()
  })
})
