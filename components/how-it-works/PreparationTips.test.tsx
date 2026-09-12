import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import PreparationTips from './PreparationTips'

describe('PreparationTips', () => {
  it('renders all 4 tips', () => {
    renderWithIntl(<PreparationTips />)
    expect(screen.getByText('Ánh sáng tự nhiên')).toBeInTheDocument()
    expect(screen.getByText('Góc chụp 90 độ')).toBeInTheDocument()
    expect(screen.getByText('Để mặt mộc tự nhiên')).toBeInTheDocument()
    expect(screen.getByText('Vén tóc gọn gàng')).toBeInTheDocument()
  })
})
