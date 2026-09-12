import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ResultPreview from './ResultPreview'
import { OutfitFlowProvider } from '../OutfitFlowProvider'

describe('ResultPreview', () => {
  it('shows the selected model and garment tone', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ResultPreview />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(/Carmen \(1m65\)/)).toBeInTheDocument()
    expect(screen.getByText(/Light Summer/)).toBeInTheDocument()
  })

  it('zooms the preview image when the zoom button is clicked', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ResultPreview />
      </OutfitFlowProvider>
    )
    const image = screen.getByAltText(/Kết quả thử đồ ảo/)
    expect(image).toHaveStyle({ transform: 'scale(1)' })
    fireEvent.click(screen.getByTitle('Phóng to'))
    expect(image).toHaveStyle({ transform: 'scale(1.35)' })
  })

  it('shows a status message when toggling the 360 view', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ResultPreview />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByTitle('Góc xoay 360'))
    expect(screen.getByText(/Đang tải mô hình không gian xoay 360/)).toBeInTheDocument()
  })
})
