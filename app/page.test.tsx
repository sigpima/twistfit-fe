import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomePage from './page'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('HomePage', () => {
  it('renders the hero headline', () => {
    render(
      <QrModalProvider>
        <HomePage />
      </QrModalProvider>
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Khám Phá Bản Sắc Riêng Cùng/)
  })

  it('opens the QR modal from the hero CTA', () => {
    render(
      <QrModalProvider>
        <HomePage />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm Tra Màu Sắc (Camera QR)'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
