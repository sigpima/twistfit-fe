import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FeatureShowcase from './FeatureShowcase'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('FeatureShowcase', () => {
  it('shows all three feature titles at once, with no tab switching', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    expect(screen.getByRole('heading', { name: 'Màu sắc cá nhân' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Phối đồ' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Diễn đàn' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('opens the QR modal from the Personal Color CTA', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm Tra Ngay'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })

  it('links the Outfit CTA to /outfit/step-1', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    expect(screen.getByRole('link', { name: 'Bắt Đầu Phối Đồ Ngay' })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('links the Forum CTA to /forum', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    expect(screen.getByRole('link', { name: 'Khám Phá Diễn Đàn' })).toHaveAttribute('href', '/forum')
  })
})
