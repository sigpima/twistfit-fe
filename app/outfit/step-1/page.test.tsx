import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import Step1Page, { metadata } from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

describe('Step1Page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sets a self-referencing canonical URL', () => {
    expect(metadata.alternates?.canonical).toBe('/outfit/step-1')
  })

  it('renders the step content', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse([]))
        if (url.includes('/quiz-attempts/me')) return Promise.resolve(jsonResponse(null))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
    renderWithIntl(
      <OutfitFlowProvider>
        <Step1Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Chọn Trang Phục Cho Buổi Thử Đồ' })).toBeInTheDocument()
  })
})
