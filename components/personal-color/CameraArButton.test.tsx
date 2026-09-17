import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import CameraArButton from './CameraArButton'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => <div data-testid="qr-code" data-value={value} />,
}))

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true })
}

describe('CameraArButton', () => {
  afterEach(() => {
    pushMock.mockClear()
  })

  it('navigates straight to /camera-frame with the matching palette on a mobile device', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15')
    renderWithIntl(<CameraArButton subSeason="true-winter" />)
    fireEvent.click(screen.getByText('Mở Camera AR'))
    expect(pushMock).toHaveBeenCalledWith('/camera-frame?palette=winter-cool')
    expect(screen.queryByText('Mở Camera AR trên điện thoại')).not.toBeInTheDocument()
  })

  it('shows a QR modal instead of navigating on desktop', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0')
    renderWithIntl(<CameraArButton subSeason="true-winter" />)
    fireEvent.click(screen.getByText('Mở Camera AR'))
    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByText('Mở Camera AR trên điện thoại')).toBeInTheDocument()
  })

  it('encodes the matching palette id in the QR code value', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0')
    renderWithIntl(<CameraArButton subSeason="light-spring" />)
    fireEvent.click(screen.getByText('Mở Camera AR'))
    expect(screen.getByTestId('qr-code').dataset.value).toContain('/camera-frame?palette=spring-light')
  })

  it('closes the QR modal when the close button is clicked', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0')
    renderWithIntl(<CameraArButton subSeason="true-winter" />)
    fireEvent.click(screen.getByText('Mở Camera AR'))
    fireEvent.click(screen.getByLabelText('Đóng'))
    expect(screen.queryByText('Mở Camera AR trên điện thoại')).not.toBeInTheDocument()
  })
})
