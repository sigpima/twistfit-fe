import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step2PageContent from './Step2PageContent'
import { OutfitFlowProvider } from '../OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const MODELS: CatalogModel[] = [
  {
    id: 1,
    name: 'Mảnh mai',
    image: '/outfit/models/female-1.jpg',
    dossierImage: '/outfit/models/female-1.jpg',
    sideImage: '/outfit/models/female-1-side.jpg',
    poseCount: 2,
    tagline: '—',
    undertone: 'neutral',
    height: '—',
    bodyShape: '—',
    waist: '—',
    personalColor: '—',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('Step2PageContent', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the step heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Bước 2: Chọn Người Mẫu' })).toBeInTheDocument()
  })

  it('links back to step 1', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Quay lại Bước 1/ })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('navigates to step 3 after confirming the model', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận người mẫu/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-3')
  })
})
