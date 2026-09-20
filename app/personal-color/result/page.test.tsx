import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import ResultPage, { metadata } from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ResultPage', () => {
  it('canonicalizes to the quiz entry page, since the result is personalized per visitor', () => {
    expect(metadata.alternates?.canonical).toBe('/personal-color/quiz')
  })

  it('renders the result page content', () => {
    renderWithIntl(
      <AuthProvider>
        <ResultPage />
      </AuthProvider>
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'KẾT QUẢ ĐÁNH GIÁ MÀU SẮC CÁ NHÂN' })
    ).toBeInTheDocument()
  })
})
