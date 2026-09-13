import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ModelCatalog from './ModelCatalog'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'

function makeModel(overrides: Partial<CatalogModel> & Pick<CatalogModel, 'id' | 'name'>): CatalogModel {
  return {
    image: `/outfit/models/${overrides.id}.jpg`,
    dossierImage: `/outfit/models/${overrides.id}.jpg`,
    poseCount: 15,
    tagline: 'Tagline',
    undertone: 'neutral',
    height: '1m65',
    bodyShape: 'Đồng hồ cát',
    waist: '64cm',
    personalColor: 'Autumn Soft',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  }
}

const MODELS: CatalogModel[] = [
  makeModel({ id: 1, name: 'Carmen', undertone: 'neutral' }),
  makeModel({ id: 2, name: 'Aisha', undertone: 'warm' }),
  makeModel({ id: 3, name: 'Astrid', undertone: 'cool' }),
  makeModel({ id: 4, name: 'Kenji', undertone: 'cool' }),
  makeModel({ id: 5, name: 'Linh Đan', undertone: 'cool' }),
]

function SelectedModelName() {
  const { selectedModel } = useOutfitFlow()
  return <p>Đang xem: {selectedModel.name}</p>
}

describe('ModelCatalog', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock-model') })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders every model passed in', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Kenji')).toBeInTheDocument()
    expect(screen.getByText('Linh Đan')).toBeInTheDocument()
  })

  it('updates the shared selected model when a card is clicked', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <SelectedModelName />
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('Kenji'))
    expect(screen.getByText('Đang xem: Kenji')).toBeInTheDocument()
  })

  it('filters the grid by undertone', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cool' }))
    expect(screen.getByText('Astrid')).toBeInTheDocument()
    expect(screen.queryByText('Aisha')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }))
    expect(screen.getByText('Aisha')).toBeInTheDocument()
  })

  it('creates and selects a custom model from an uploaded photo', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <SelectedModelName />
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    const file = new File(['fake'], 'me.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Tải ảnh mặt \/ dáng/) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText('Đang xem: Ảnh của bạn')).toBeInTheDocument()
  })
})
