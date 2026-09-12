import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Header from './Header'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('Header', () => {
  it('renders nav links to the expected routes', () => {
    renderWithIntl(
      <QrModalProvider>
        <Header />
      </QrModalProvider>
    )
    expect(screen.getByRole('link', { name: 'About us' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/how-it-works')
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
  })

  it('opens the QR modal when the CTA button is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <Header />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm tra Personal Color'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
