import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import HomePage from './page'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('HomePage', () => {
  it('renders the hero headline', () => {
    renderWithIntl(
      <QrModalProvider>
        <HomePage />
      </QrModalProvider>
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Vặn nhẹ góc nhìn/)
  })

  it('opens the QR modal from the hero CTA', () => {
    renderWithIntl(
      <QrModalProvider>
        <HomePage />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm Tra Màu Sắc (Camera QR)'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
