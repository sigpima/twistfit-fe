import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PreparationTips from './PreparationTips'

describe('PreparationTips', () => {
  it('renders all 4 tips', () => {
    render(<PreparationTips />)
    expect(screen.getByText('Ánh sáng tự nhiên')).toBeInTheDocument()
    expect(screen.getByText('Góc chụp 90 độ')).toBeInTheDocument()
    expect(screen.getByText('Để mặt mộc tự nhiên')).toBeInTheDocument()
    expect(screen.getByText('Vén tóc gọn gàng')).toBeInTheDocument()
  })
})
