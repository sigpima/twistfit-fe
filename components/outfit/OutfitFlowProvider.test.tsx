import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  OutfitFlowProvider,
  useOutfitFlow,
  DEFAULT_GARMENT,
  FALLBACK_MODEL,
  DEFAULT_POSE,
} from './OutfitFlowProvider'

function TestConsumer() {
  const {
    selectedGarment,
    setSelectedGarment,
    selectedModel,
    setSelectedModel,
    selectedPose,
    setSelectedPose,
    maxStepReached,
    markStepVisited,
  } = useOutfitFlow()
  return (
    <div>
      <span>{selectedGarment.name}</span>
      <span>{selectedModel.name}</span>
      <span>{selectedPose.label}</span>
      <span>Max: {maxStepReached}</span>
      <button onClick={() => markStepVisited(3)}>mark step 3</button>
      <button onClick={() => markStepVisited(2)}>mark step 2</button>
      <button onClick={() => setSelectedPose({ id: 'side', label: 'Nghiêng cạnh bên' })}>select side pose</button>
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
    expect(screen.getByText(FALLBACK_MODEL.name)).toBeInTheDocument()
    expect(screen.getByText(DEFAULT_POSE.label)).toBeInTheDocument()
  })

  it('updates the selected pose when setSelectedPose is called', () => {
    render(
      <OutfitFlowProvider>
        <TestConsumer />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('select side pose'))
    expect(screen.getByText('Nghiêng cạnh bên')).toBeInTheDocument()
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

  it('starts with the furthest step reached at 1', () => {
    render(
      <OutfitFlowProvider>
        <TestConsumer />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Max: 1')).toBeInTheDocument()
  })

  it('advances the furthest step reached when markStepVisited is called with a later step', () => {
    render(
      <OutfitFlowProvider>
        <TestConsumer />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('mark step 3'))
    expect(screen.getByText('Max: 3')).toBeInTheDocument()
  })

  it('does not lower the furthest step reached when marking an earlier step', () => {
    render(
      <OutfitFlowProvider>
        <TestConsumer />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('mark step 3'))
    fireEvent.click(screen.getByText('mark step 2'))
    expect(screen.getByText('Max: 3')).toBeInTheDocument()
  })
})
