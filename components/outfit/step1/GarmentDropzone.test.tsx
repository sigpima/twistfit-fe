import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GarmentDropzone from './GarmentDropzone'
import { OutfitFlowProvider } from '../OutfitFlowProvider'

describe('GarmentDropzone', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock-preview') })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the selected garment name and image by default', () => {
    render(
      <OutfitFlowProvider>
        <GarmentDropzone />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Áo Peplum Voan Xếp Ly Hồng Phấn')).toBeInTheDocument()
    expect(screen.getByAltText('Áo Peplum Voan Xếp Ly Hồng Phấn')).toHaveAttribute(
      'src',
      '/outfit/garment-peplum-main.jpg'
    )
  })

  it('previews an uploaded image and resets back to the selected garment image', () => {
    render(
      <OutfitFlowProvider>
        <GarmentDropzone />
      </OutfitFlowProvider>
    )
    const file = new File(['fake'], 'my-shirt.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Kéo thả hoặc Bấm để đổi ảnh/) as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByAltText('Áo Peplum Voan Xếp Ly Hồng Phấn')).toHaveAttribute('src', 'blob:mock-preview')

    fireEvent.click(screen.getByTitle('Đặt lại ảnh'))
    expect(screen.getByAltText('Áo Peplum Voan Xếp Ly Hồng Phấn')).toHaveAttribute(
      'src',
      '/outfit/garment-peplum-main.jpg'
    )
  })

  it('toggles the background removal switch', () => {
    render(
      <OutfitFlowProvider>
        <GarmentDropzone />
      </OutfitFlowProvider>
    )
    const toggle = screen.getByLabelText('Tự động bóc nền AI (Background Removal)') as HTMLInputElement
    expect(toggle.checked).toBe(true)
    fireEvent.click(toggle)
    expect(toggle.checked).toBe(false)
  })
})
