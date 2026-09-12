import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import CapsuleWardrobe from './CapsuleWardrobe'

describe('CapsuleWardrobe', () => {
  it('renders all 3 suggested outfit sets', () => {
    renderWithIntl(<CapsuleWardrobe />)
    expect(screen.getByText('Thanh Lịch Công Sở')).toBeInTheDocument()
    expect(screen.getByText('Hẹn Hò & Dạo Phố')).toBeInTheDocument()
    expect(screen.getByText('Phụ Kiện Tối Ưu')).toBeInTheDocument()
  })

  it('links to the personal color quiz', () => {
    renderWithIntl(<CapsuleWardrobe />)
    expect(screen.getByRole('link', { name: 'Làm Bài Test Personal Color' })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
  })
})
