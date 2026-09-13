import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'
import Step2Page from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MODELS: CatalogModel[] = [
  {
    id: 1,
    name: 'Carmen',
    image: '/outfit/models/carmen-card.jpg',
    dossierImage: '/outfit/models/carmen-dossier.jpg',
    poseCount: 15,
    tagline: 'Tông da: Warm Neutral',
    undertone: 'neutral',
    height: '1m65',
    bodyShape: 'Đồng hồ cát',
    waist: '64cm',
    personalColor: 'Autumn Soft',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('Step2Page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the step heading with models loaded from the database', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MODELS }))
    const page = await Step2Page()
    renderWithIntl(<OutfitFlowProvider>{page}</OutfitFlowProvider>)
    expect(
      screen.getByRole('heading', { name: 'Bước 2: Chọn Người Mẫu Hoặc Tải Ảnh Cá Nhân' })
    ).toBeInTheDocument()
  })
})
