import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ContactPage from './page'

describe('ContactPage', () => {
  it('renders the contact section', () => {
    renderWithIntl(<ContactPage />)
    expect(screen.getByRole('heading', { name: 'Chúng Tôi Luôn Lắng Nghe Ý Kiến Của Bạn' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hòm Thư Góp Ý' })).toBeInTheDocument()
  })
})
