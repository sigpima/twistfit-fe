import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OutfitFlowProvider, useOutfitFlow, DEFAULT_GARMENT, DEFAULT_MODEL } from './OutfitFlowProvider'

function TestConsumer() {
  const { selectedGarment, setSelectedGarment, selectedModel, setSelectedModel } = useOutfitFlow()
  return (
    <div>
      <span>{selectedGarment.name}</span>
      <span>{selectedModel.name}</span>
      <button
        onClick={() =>
          setSelectedGarment({
            id: 'dress-blue',
            name: 'Đầm Lụa Satin Xanh Cerulean',
            image: '/outfit/garment-dress-blue.jpg',
            thumbnail: '/outfit/garment-dress-blue.jpg',
            matchScore: '94%',
            tone: 'Cool Winter',
            type: 'Dress',
          })
        }
      >
        select dress
      </button>
      <button
        onClick={() =>
          setSelectedModel({
            id: 'kenji',
            name: 'Kenji',
            image: '/outfit/models/kenji.jpg',
            dossierImage: '/outfit/models/kenji.jpg',
            poseCount: 12,
            tagline: 'Tokyo Street • Tối giản',
            undertone: 'cool',
            height: '1m78',
            bodyShape: 'Chữ nhật',
            waist: '78cm',
            personalColor: 'Cool Winter',
          })
        }
      >
        select kenji
      </button>
    </div>
  )
}

describe('OutfitFlowProvider', () => {
  it('provides the default garment and model before any selection', () => {
    render(
      <OutfitFlowProvider>
        <TestConsumer />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(DEFAULT_GARMENT.name)).toBeInTheDocument()
    expect(screen.getByText(DEFAULT_MODEL.name)).toBeInTheDocument()
  })

  it('updates the selected garment when setSelectedGarment is called', () => {
    render(
      <OutfitFlowProvider>
        <TestConsumer />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('select dress'))
    expect(screen.getByText('Đầm Lụa Satin Xanh Cerulean')).toBeInTheDocument()
  })

  it('updates the selected model when setSelectedModel is called', () => {
    render(
      <OutfitFlowProvider>
        <TestConsumer />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('select kenji'))
    expect(screen.getByText('Kenji')).toBeInTheDocument()
  })
})
