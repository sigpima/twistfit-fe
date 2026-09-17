import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
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
})
