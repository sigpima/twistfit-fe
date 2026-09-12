import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FaqSupportBanner from './FaqSupportBanner'

describe('FaqSupportBanner', () => {
  it('renders the support call-to-action', () => {
    render(<FaqSupportBanner />)
    expect(screen.getByText('Vẫn Còn Câu Hỏi Chưa Được Giải Đáp?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Liên hệ hỗ trợ ngay/ })).toBeInTheDocument()
  })
})
