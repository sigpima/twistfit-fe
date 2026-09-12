import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ColorProfileCard from './ColorProfileCard'

describe('ColorProfileCard', () => {
  it('renders the season title and tone summary', () => {
    render(<ColorProfileCard />)
    expect(screen.getByRole('heading', { level: 3, name: 'Mùa Đông (Winter)' })).toBeInTheDocument()
    expect(screen.getByText('Tông lạnh – Sắc nét – Rõ ràng')).toBeInTheDocument()
  })

  it('renders the ideal palette heading', () => {
    render(<ColorProfileCard />)
    expect(screen.getByText('Bảng màu lý tưởng của bạn – Mùa Đông')).toBeInTheDocument()
  })
})
