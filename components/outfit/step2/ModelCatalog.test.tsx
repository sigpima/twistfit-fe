import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ModelCatalog from './ModelCatalog'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'

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

  it('renders all 12 models and marks Carmen as selected by default', () => {
    render(
      <OutfitFlowProvider>
        <ModelCatalog />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Kenji')).toBeInTheDocument()
    expect(screen.getByText('Linh Đan')).toBeInTheDocument()
    expect(screen.getAllByText('Đang chọn')).toHaveLength(1)
  })

  it('updates the shared selected model when a card is clicked', () => {
    render(
      <OutfitFlowProvider>
        <SelectedModelName />
        <ModelCatalog />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('Kenji'))
    expect(screen.getByText('Đang xem: Kenji')).toBeInTheDocument()
  })

  it('filters the grid by undertone', () => {
    render(
      <OutfitFlowProvider>
        <ModelCatalog />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cool' }))
    expect(screen.getByText('Astrid')).toBeInTheDocument()
    expect(screen.queryByText('Aisha')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }))
    expect(screen.getByText('Aisha')).toBeInTheDocument()
  })

  it('creates and selects a custom model from an uploaded photo', () => {
    render(
      <OutfitFlowProvider>
        <SelectedModelName />
        <ModelCatalog />
      </OutfitFlowProvider>
    )
    const file = new File(['fake'], 'me.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Tải ảnh mặt \/ dáng/) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText('Đang xem: Ảnh của bạn')).toBeInTheDocument()
  })
})
