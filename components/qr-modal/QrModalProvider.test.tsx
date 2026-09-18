import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { QrModalProvider, useQrModal } from './QrModalProvider'

function TestConsumer() {
  const { openQrModal, closeQrModal } = useQrModal()
  return (
    <div>
      <button onClick={openQrModal}>open</button>
      <button onClick={closeQrModal}>close</button>
    </div>
  )
}

describe('QrModalProvider', () => {
  it('does not render the modal by default', () => {
    renderWithIntl(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    expect(screen.queryByText('Kiểm Tra Màu Sắc Cá Nhân')).not.toBeInTheDocument()
  })

  it('opens the modal when openQrModal is called', () => {
    renderWithIntl(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByText('Kiểm Tra Màu Sắc Cá Nhân')).toBeInTheDocument()
  })

  it('closes the modal when the close button is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByLabelText('Đóng'))
    expect(screen.queryByText('Kiểm Tra Màu Sắc Cá Nhân')).not.toBeInTheDocument()
  })

  it('closes the modal when the backdrop is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByTestId('qr-modal-backdrop'))
    expect(screen.queryByText('Kiểm Tra Màu Sắc Cá Nhân')).not.toBeInTheDocument()
  })
})
