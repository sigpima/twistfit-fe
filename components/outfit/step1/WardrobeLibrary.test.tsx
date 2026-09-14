import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import WardrobeLibrary from './WardrobeLibrary'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'

function SelectedGarmentName() {
  const { selectedGarment } = useOutfitFlow()
  return <p>Đang chọn: {selectedGarment.name}</p>
}

function renderLibrary() {
  return renderWithIntl(
    <OutfitFlowProvider>
      <SelectedGarmentName />
      <WardrobeLibrary />
    </OutfitFlowProvider>
  )
}

describe('WardrobeLibrary', () => {
  it('defaults to occasion mode showing items tagged "Hằng ngày"', () => {
    renderLibrary()
    expect(screen.getByRole('button', { name: 'Hằng ngày' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Áo Thun Cổ Chữ V Đỏ')).toBeInTheDocument()
    expect(screen.queryByText('Áo Sơ Mi Tay Dài Be')).not.toBeInTheDocument()
  })

  it('filters the grid when a different occasion chip is clicked', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('button', { name: 'Dự tiệc' }))
    expect(screen.getByText('Áo Sơ Mi Tay Dài Be')).toBeInTheDocument()
    expect(screen.queryByText('Áo Thun Cổ Chữ V Đỏ')).not.toBeInTheDocument()
  })

  it('switches to style chips and filters accordingly', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('button', { name: 'Theo phong cách' }))
    fireEvent.click(screen.getByRole('button', { name: 'Formal' }))
    expect(screen.getByText('Áo Sơ Mi Tay Dài Be')).toBeInTheDocument()
    expect(screen.queryByText('Quần Short Jean Xanh')).not.toBeInTheDocument()
  })

  it('shows the personal color CTA link when the demo toggle is off', () => {
    renderLibrary()
    expect(screen.getByRole('link', { name: /Personal Color/ })).toHaveAttribute('href', '/personal-color/quiz')
    expect(screen.queryByText('Phối đồ theo kết quả đánh giá personal color')).not.toBeInTheDocument()
  })

  it('shows the personal color checkbox once the demo toggle is switched on', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Demo: đã test PC' }))
    expect(screen.getByText('Phối đồ theo kết quả đánh giá personal color')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Personal Color/ })).not.toBeInTheDocument()
  })

  it('selects a wardrobe item and updates the shared flow state', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('button', { name: /Áo Thun Cổ Chữ V Đỏ/ }))
    expect(screen.getByText('Đang chọn: Áo Thun Cổ Chữ V Đỏ')).toBeInTheDocument()
  })

  it('opens the sort menu with the category option pre-selected', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('button', { name: /Sắp xếp/ }))
    expect(screen.getByRole('button', { name: /Theo loại áo quần/ })).toBeInTheDocument()
  })
})
