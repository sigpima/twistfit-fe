import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import PoseSelector from './PoseSelector'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'

function ChangeModelButton() {
  const { setSelectedModel } = useOutfitFlow()
  return (
    <button
      onClick={() =>
        setSelectedModel({
          id: 'male-2',
          name: 'Vạm vỡ',
          image: '/outfit/models/male-2.jpg',
          sideImage: '/outfit/models/male-2-side.jpg',
        })
      }
    >
      select male-2
    </button>
  )
}

describe('PoseSelector', () => {
  it('shows the front and side photos of the selected model', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <PoseSelector />
      </OutfitFlowProvider>
    )
    expect(screen.getByAltText('Đứng thẳng phía trước')).toHaveAttribute('src', '/outfit/models/female-1.jpg')
    expect(screen.getByAltText('Nghiêng cạnh bên')).toHaveAttribute('src', '/outfit/models/female-1-side.jpg')
  })

  it('shows the default pose as selected', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <PoseSelector />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('button', { name: /Đứng thẳng phía trước/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates the shared selected pose when a different pose is clicked', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <PoseSelector />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Nghiêng cạnh bên/ }))
    expect(screen.getByRole('button', { name: /Nghiêng cạnh bên/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Đứng thẳng phía trước/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('uses the selected model photos when the model changes', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ChangeModelButton />
        <PoseSelector />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('select male-2'))
    expect(screen.getByAltText('Đứng thẳng phía trước')).toHaveAttribute('src', '/outfit/models/male-2.jpg')
    expect(screen.getByAltText('Nghiêng cạnh bên')).toHaveAttribute('src', '/outfit/models/male-2-side.jpg')
  })
})
