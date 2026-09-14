import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { LoginRequiredModalProvider, useLoginRequiredModal } from './LoginRequiredModalProvider'

function TestConsumer() {
  const { openLoginRequiredModal, closeLoginRequiredModal } = useLoginRequiredModal()
  return (
    <div>
      <button onClick={openLoginRequiredModal}>open</button>
      <button onClick={closeLoginRequiredModal}>close</button>
    </div>
  )
}

describe('LoginRequiredModalProvider', () => {
  it('does not render the modal by default', () => {
    renderWithIntl(
      <LoginRequiredModalProvider>
        <TestConsumer />
      </LoginRequiredModalProvider>
    )
    expect(screen.queryByText('Bạn cần đăng nhập')).not.toBeInTheDocument()
  })

  it('opens the modal when openLoginRequiredModal is called', () => {
    renderWithIntl(
      <LoginRequiredModalProvider>
        <TestConsumer />
      </LoginRequiredModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByText('Bạn cần đăng nhập')).toBeInTheDocument()
  })

  it('closes the modal when the close button is clicked', () => {
    renderWithIntl(
      <LoginRequiredModalProvider>
        <TestConsumer />
      </LoginRequiredModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByLabelText('Đóng'))
    expect(screen.queryByText('Bạn cần đăng nhập')).not.toBeInTheDocument()
  })

  it('links to the login page', () => {
    renderWithIntl(
      <LoginRequiredModalProvider>
        <TestConsumer />
      </LoginRequiredModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByRole('link', { name: /Đăng nhập ngay/ })).toHaveAttribute('href', '/login')
  })
})
