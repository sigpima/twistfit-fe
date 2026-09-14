import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
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
          sideImage: null,
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
    renderWithIntl(
      <OutfitFlowProvider>
        <ModelDossier />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(/Carmen \(TwistFit Official\)/)).toBeInTheDocument()
    expect(screen.getByText('1m65')).toBeInTheDocument()
    expect(screen.getByText('Autumn Soft')).toBeInTheDocument()
  })

  it('updates when the selected model changes', () => {
    renderWithIntl(
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
    renderWithIntl(
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
