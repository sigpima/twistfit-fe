import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ImageLightbox from './ImageLightbox'

describe('ImageLightbox', () => {
  it('renders the image large', () => {
    renderWithIntl(<ImageLightbox src="https://example.com/a.png" alt="Ảnh mô tả" onClose={vi.fn()} />)
    expect(screen.getByAltText('Ảnh mô tả')).toHaveAttribute('src', 'https://example.com/a.png')
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderWithIntl(<ImageLightbox src="https://example.com/a.png" alt="Ảnh mô tả" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when clicking the backdrop', () => {
    const onClose = vi.fn()
    renderWithIntl(<ImageLightbox src="https://example.com/a.png" alt="Ảnh mô tả" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('image-lightbox-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose when clicking the image itself', () => {
    const onClose = vi.fn()
    renderWithIntl(<ImageLightbox src="https://example.com/a.png" alt="Ảnh mô tả" onClose={onClose} />)
    fireEvent.click(screen.getByAltText('Ảnh mô tả'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when pressing Escape', () => {
    const onClose = vi.fn()
    renderWithIntl(<ImageLightbox src="https://example.com/a.png" alt="Ảnh mô tả" onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
