import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import MissionVisionGrid from './MissionVisionGrid'

describe('MissionVisionGrid', () => {
  it('renders the mission quote and all mission paragraphs', () => {
    renderWithIntl(<MissionVisionGrid />)
    expect(
      screen.getByRole('heading', { name: 'Hiểu Rõ Chính Mình, Làm Chủ Phong Cách' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '"Mặc đẹp thực chất không bắt đầu từ việc sắm thêm một món đồ mới, mà khởi nguồn từ khoảnh khắc bạn thực sự thấu hiểu bản thân."'
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/Chúng ta đều từng đứng trước tủ đồ chật kín/)).toBeInTheDocument()
    expect(screen.getByText(/TwistFit ra đời để thay đổi hoàn toàn trải nghiệm/)).toBeInTheDocument()
    expect(screen.getByText(/giá trị lớn nhất mà TwistFit mong muốn trao gửi/)).toBeInTheDocument()
  })

  it('renders the vision heading and body', () => {
    renderWithIntl(<MissionVisionGrid />)
    expect(
      screen.getByRole('heading', { name: 'Hệ Sinh Thái Thời Trang Số Dẫn Đầu Giới Trẻ Việt' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Trở thành mạng xã hội phối đồ AI tiên phong/)).toBeInTheDocument()
  })

  it('no longer renders the removed core value cards', () => {
    renderWithIntl(<MissionVisionGrid />)
    expect(screen.queryByText('Cá Nhân Hóa Tối Đa')).not.toBeInTheDocument()
    expect(screen.queryByText('Khoa Học & Chính Xác')).not.toBeInTheDocument()
    expect(screen.queryByText('Bền Vững & Tối Ưu')).not.toBeInTheDocument()
  })
})
