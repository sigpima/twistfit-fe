import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FeatureBento from './FeatureBento'

describe('FeatureBento', () => {
  it('renders all three feature cards', () => {
    renderWithIntl(<FeatureBento />)
    expect(screen.getByText('1. Số hóa tủ đồ thần tốc')).toBeInTheDocument()
    expect(screen.getByText('2. Phân tích quang phổ')).toBeInTheDocument()
    expect(screen.getByText('3. Lên đồ thông minh mỗi ngày')).toBeInTheDocument()
  })
})
