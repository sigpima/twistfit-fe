import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OutfitFlowProvider, useOutfitFlow, DEFAULT_GARMENT } from './OutfitFlowProvider'

function TestConsumer() {
  const { selectedGarment, setSelectedGarment } = useOutfitFlow()
  return (
    <div>
      <span>{selectedGarment.name}</span>
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
    </div>
  )
}

describe('OutfitFlowProvider', () => {
  it('provides the default garment before any selection', () => {
    render(
      <OutfitFlowProvider>
        <TestConsumer />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(DEFAULT_GARMENT.name)).toBeInTheDocument()
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
})
