import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqSupportBanner from './FaqSupportBanner'

describe('FaqSupportBanner', () => {
  it('renders the support call-to-action', () => {
    renderWithIntl(<FaqSupportBanner />)
    expect(screen.getByText('Vẫn Còn Câu Hỏi Chưa Được Giải Đáp?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Liên hệ hỗ trợ ngay/ })).toBeInTheDocument()
  })
})
