import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AboutPage from './page'

describe('AboutPage', () => {
  it('renders the story sections and logo meaning', () => {
    renderWithIntl(<AboutPage />)
    expect(screen.getByRole('heading', { name: 'Ý nghĩa thương hiệu' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ý nghĩa logo' })).toBeInTheDocument()
  })
})
