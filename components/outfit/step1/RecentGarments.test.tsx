import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import RecentGarments from './RecentGarments'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'

function SelectedGarmentName() {
  const { selectedGarment } = useOutfitFlow()
  return <p>Đang chọn: {selectedGarment.name}</p>
}

describe('RecentGarments', () => {
  it('renders all four garment thumbnails', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <RecentGarments />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Áo peplum hồng')).toBeInTheDocument()
    expect(screen.getByText('Đầm xanh satin')).toBeInTheDocument()
    expect(screen.getByText('Blazer lửng đen')).toBeInTheDocument()
    expect(screen.getByText('Váy xếp ly kem')).toBeInTheDocument()
  })

  it('updates the shared selected garment when a thumbnail is clicked', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <SelectedGarmentName />
        <RecentGarments />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('Blazer lửng đen'))
    expect(screen.getByText('Đang chọn: Blazer Cắt Cúp Đen Tối Giản')).toBeInTheDocument()
  })
})
