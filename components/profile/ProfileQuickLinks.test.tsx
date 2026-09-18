import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ProfileQuickLinks from './ProfileQuickLinks'

describe('ProfileQuickLinks', () => {
  it('links to the wardrobe, saved collection and result pages', () => {
    renderWithIntl(<ProfileQuickLinks />)
    expect(screen.getByRole('link', { name: /Tủ đồ/ })).toHaveAttribute('href', '/outfit/step-1')
    expect(screen.getByRole('link', { name: /Đã lưu/ })).toHaveAttribute('href', '/collection')
    expect(screen.getByRole('link', { name: /Kết quả/ })).toHaveAttribute('href', '/personal-color/result')
  })
})
