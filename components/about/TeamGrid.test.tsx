import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TeamGrid from './TeamGrid'

describe('TeamGrid', () => {
  it('renders all 3 team members', () => {
    render(<TeamGrid />)
    expect(screen.getByText('Trần Mai Anh')).toBeInTheDocument()
    expect(screen.getByText('Dr. Lê Quang Huy')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Khánh Linh')).toBeInTheDocument()
  })
})
