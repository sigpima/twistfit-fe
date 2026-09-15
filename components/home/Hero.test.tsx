import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Hero from './Hero'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('Hero', () => {
  it('renders the main headline', () => {
    renderWithIntl(
      <QrModalProvider>
        <Hero />
      </QrModalProvider>
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Vặn nhẹ góc nhìn/)
  })

  it('renders the three benefit bullets', () => {
    renderWithIntl(
      <QrModalProvider>
        <Hero />
      </QrModalProvider>
    )
    expect(screen.getByText(/Nhìn tủ đồ qua một lăng kính hoàn toàn mới/)).toBeInTheDocument()
    expect(screen.getByText(/Hiểu rõ sắc da và những gam màu/)).toBeInTheDocument()
    expect(screen.getByText(/Lướt diễn đàn, trao đổi mẹo phối/)).toBeInTheDocument()
  })

  it('opens the QR modal when the camera CTA is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <Hero />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm Tra Màu Sắc (Camera QR)'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
