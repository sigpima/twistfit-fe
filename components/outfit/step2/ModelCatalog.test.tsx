import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ModelCatalog from './ModelCatalog'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'

function makeModel(overrides: Partial<CatalogModel> & Pick<CatalogModel, 'id' | 'name'>): CatalogModel {
  return {
    image: `/outfit/models/${overrides.id}.jpg`,
    dossierImage: `/outfit/models/${overrides.id}.jpg`,
    sideImage: `/outfit/models/${overrides.id}-side.jpg`,
    poseCount: 2,
    tagline: '—',
    undertone: 'neutral',
    height: '—',
    bodyShape: '—',
    waist: '—',
    personalColor: '—',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  }
}

const MODELS: CatalogModel[] = [
  makeModel({ id: 1, name: 'Mảnh mai' }),
  makeModel({ id: 2, name: 'Thể thao' }),
  makeModel({ id: 5, name: 'Thư sinh' }),
]

function SelectedModelName() {
  const { selectedModel } = useOutfitFlow()
  return <p>Đang xem: {selectedModel.name}</p>
}

describe('ModelCatalog', () => {
  it('renders every model passed in', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Mảnh mai')).toBeInTheDocument()
    expect(screen.getByText('Thể thao')).toBeInTheDocument()
    expect(screen.getByText('Thư sinh')).toBeInTheDocument()
  })

  it('shows the front-facing image for each model', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByAltText('Mảnh mai')).toHaveAttribute('src', '/outfit/models/1.jpg')
  })

  it('updates the shared selected model when a card is clicked, including its side image', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <SelectedModelName />
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('Thư sinh'))
    expect(screen.getByText('Đang xem: Thư sinh')).toBeInTheDocument()
  })

  it('marks the selected card', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    const card = screen.getByText('Thể thao').closest('button') as HTMLButtonElement
    fireEvent.click(card)
    expect(card).toHaveAttribute('aria-pressed', 'true')
  })
})
