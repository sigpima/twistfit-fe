import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TeamGrid from './TeamGrid'

describe('TeamGrid', () => {
  it('renders all 3 team members', () => {
    renderWithIntl(<TeamGrid />)
    expect(screen.getByText('Trần Mai Anh')).toBeInTheDocument()
    expect(screen.getByText('Dr. Lê Quang Huy')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Khánh Linh')).toBeInTheDocument()
  })
})
