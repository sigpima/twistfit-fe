import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AboutHero from './AboutHero'

describe('AboutHero', () => {
  it('renders the greeting headline', () => {
    renderWithIntl(<AboutHero />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Xin chào, tụi mình là TwistFit!' })
    ).toBeInTheDocument()
  })

  it('renders the hook copy paragraphs', () => {
    renderWithIntl(<AboutHero />)
    expect(screen.getByText(/Hôm nay mặc gì/)).toBeInTheDocument()
    expect(screen.getByText(/xác định đúng bảng màu cá nhân/)).toBeInTheDocument()
    expect(screen.getByText(/kể cho bạn nghe hành trình TwistFit ra đời/)).toBeInTheDocument()
  })
})
