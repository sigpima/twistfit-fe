import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
    render(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    expect(screen.queryByText('Kiểm Tra Personal Color')).not.toBeInTheDocument()
  })

  it('opens the modal when openQrModal is called', () => {
    render(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })

  it('closes the modal when the close button is clicked', () => {
    render(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByLabelText('Đóng'))
    expect(screen.queryByText('Kiểm Tra Personal Color')).not.toBeInTheDocument()
  })

  it('closes the modal when the backdrop is clicked', () => {
    render(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByTestId('qr-modal-backdrop'))
    expect(screen.queryByText('Kiểm Tra Personal Color')).not.toBeInTheDocument()
  })
})
