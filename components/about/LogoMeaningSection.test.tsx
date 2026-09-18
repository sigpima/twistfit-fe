import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import LogoMeaningSection from './LogoMeaningSection'

describe('LogoMeaningSection', () => {
  it('renders collapsed with an expand control', () => {
    renderWithIntl(<LogoMeaningSection />)
    expect(screen.getByRole('heading', { name: 'Ý nghĩa logo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xem thêm' })).toBeInTheDocument()
  })

  it('expands to show the full body and collapses again on click', () => {
    renderWithIntl(<LogoMeaningSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm' }))
    expect(screen.getByRole('button', { name: 'Thu gọn' })).toBeInTheDocument()
    expect(screen.getByText(/triết lý chuyển dịch/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }))
    expect(screen.getByRole('button', { name: 'Xem thêm' })).toBeInTheDocument()
  })
})
