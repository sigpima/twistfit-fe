import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FlowOverviewBanner from './FlowOverviewBanner'

describe('FlowOverviewBanner', () => {
  it('hides the overview image until toggled open', () => {
    render(
      <FlowOverviewBanner
        title="Lộ trình thử đồ thông minh cá nhân hóa"
        subtitle="Hệ thống phân tách bóc phông chuẩn Studio, hỗ trợ link sàn Shopee, Zara, TikTok Shop"
        image="/outfit/flow-overview.png"
        imageAlt="Quy trình thử đồ ảo TwistFit 4 bước"
      />
    )
    expect(screen.queryByAltText('Quy trình thử đồ ảo TwistFit 4 bước')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Xem tổng quan quy trình/ }))
    expect(screen.getByAltText('Quy trình thử đồ ảo TwistFit 4 bước')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ẩn sơ đồ/ }))
    expect(screen.queryByAltText('Quy trình thử đồ ảo TwistFit 4 bước')).not.toBeInTheDocument()
  })
})
