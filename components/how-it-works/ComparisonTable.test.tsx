import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ComparisonTable from './ComparisonTable'

describe('ComparisonTable', () => {
  it('renders the comparison rows for traditional vs TwistFit AI', () => {
    render(<ComparisonTable />)
    expect(screen.getByText('Chi phí mỗi lần test')).toBeInTheDocument()
    expect(screen.getByText('1.500.000đ - 3.500.000đ / buổi')).toBeInTheDocument()
    expect(screen.getByText('30 giây trực tiếp trên điện thoại 24/7')).toBeInTheDocument()
  })
})
