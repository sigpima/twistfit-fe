import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorProfileCard from './ColorProfileCard'

describe('ColorProfileCard', () => {
  it('renders the season title and tone summary', () => {
    renderWithIntl(<ColorProfileCard />)
    expect(screen.getByRole('heading', { level: 3, name: 'Mùa Đông (Winter)' })).toBeInTheDocument()
    expect(screen.getByText('Tông lạnh – Sắc nét – Rõ ràng')).toBeInTheDocument()
  })

  it('renders the ideal palette heading', () => {
    renderWithIntl(<ColorProfileCard />)
    expect(screen.getByText('Bảng màu lý tưởng của bạn – Mùa Đông')).toBeInTheDocument()
  })
})
