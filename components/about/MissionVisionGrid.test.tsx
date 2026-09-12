import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import MissionVisionGrid from './MissionVisionGrid'

describe('MissionVisionGrid', () => {
  it('renders the mission, vision and 3 core values', () => {
    render(<MissionVisionGrid />)
    expect(screen.getByText('Giải Phóng Tự Do Thể Hiện Bản Thân')).toBeInTheDocument()
    expect(screen.getByText('Nền Tảng Thời Trang Cá Nhân Hóa Hàng Đầu')).toBeInTheDocument()
    expect(screen.getByText('Cá Nhân Hóa Tối Đa')).toBeInTheDocument()
    expect(screen.getByText('Khoa Học & Chính Xác')).toBeInTheDocument()
    expect(screen.getByText('Bền Vững & Tối Ưu')).toBeInTheDocument()
  })
})
