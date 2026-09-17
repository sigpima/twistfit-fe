import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import PersonalColorSection from './PersonalColorSection'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PersonalColorSection', () => {
  it('shows the empty state with a CTA when there is no result yet', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => null }))
    renderWithIntl(<PersonalColorSection />)

    await waitFor(() => expect(screen.getByText('Bạn chưa có kết quả Personal Color nào.')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Làm bài test ngay' })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
  })

  it('shows the season name and a link to the full result when a result exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          subSeason: 'true-spring',
          hueResult: 'warm',
          valueResult: 'medium',
          chromaResult: 'bright',
        }),
      })
    )
    renderWithIntl(<PersonalColorSection />)

    await waitFor(() => expect(screen.getByText('Xuân Thuần (True Spring)')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Xem chi tiết' })).toHaveAttribute('href', '/personal-color/result')
  })
})
