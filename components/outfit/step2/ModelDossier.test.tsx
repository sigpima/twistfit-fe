import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ModelDossier from './ModelDossier'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'

function SwitchToKenji() {
  const { setSelectedModel } = useOutfitFlow()
  return (
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
          height: '1m75',
          bodyShape: 'Chữ nhật',
          waist: '76cm',
          personalColor: 'Cool Winter Deep',
        })
      }
    >
      switch to kenji
    </button>
  )
}

describe('ModelDossier', () => {
  it('shows the default selected model profile', () => {
    render(
      <OutfitFlowProvider>
        <ModelDossier />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(/Carmen \(TwistFit Official\)/)).toBeInTheDocument()
    expect(screen.getByText('1m65')).toBeInTheDocument()
    expect(screen.getByText('Autumn Soft')).toBeInTheDocument()
  })

  it('updates when the selected model changes', () => {
    render(
      <OutfitFlowProvider>
        <SwitchToKenji />
        <ModelDossier />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('switch to kenji'))
    expect(screen.getByText(/Kenji \(TwistFit Official\)/)).toBeInTheDocument()
    expect(screen.getByText('Cool Winter Deep')).toBeInTheDocument()
  })

  it('toggles the HD quality switch', () => {
    render(
      <OutfitFlowProvider>
        <ModelDossier />
      </OutfitFlowProvider>
    )
    const toggle = screen.getByLabelText('Chế độ chất lượng cao HD') as HTMLInputElement
    expect(toggle.checked).toBe(true)
    fireEvent.click(toggle)
    expect(toggle.checked).toBe(false)
  })
})
