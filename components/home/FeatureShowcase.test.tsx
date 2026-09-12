import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FeatureShowcase from './FeatureShowcase'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('FeatureShowcase', () => {
  it('shows the Phối Đồ Thông Minh panel by default', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    expect(screen.getByText('Studio Thử Đồ Ảo AI')).toBeInTheDocument()
  })

  it('switches to the Personal Color Test panel when its tab is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: /Personal Color Test/ }))
    expect(screen.getByText('Kết Quả Đo Sắc Tố Thực Tế')).toBeInTheDocument()
    expect(screen.queryByText('Studio Thử Đồ Ảo AI')).not.toBeInTheDocument()
  })

  it('switches to the Diễn Đàn Phong Cách panel when its tab is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: /Diễn Đàn Phong Cách/ }))
    expect(screen.getByText('Cộng Đồng TwistFit Style Club')).toBeInTheDocument()
  })

  it('opens the QR modal from the Personal Color Test panel CTA', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: /Personal Color Test/ }))
    fireEvent.click(screen.getByText('Mở Quét QR / Test Ngay'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
