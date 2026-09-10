import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CameraView from './CameraView'
import { useCameraStream } from '@/hooks/useCameraStream'

vi.mock('@/hooks/useCameraStream', () => ({
  useCameraStream: vi.fn(),
}))

describe('CameraView', () => {
  it('shows an error message when the hook reports an error', () => {
    vi.mocked(useCameraStream).mockReturnValue({
      status: 'error',
      stream: null,
      errorMessage: 'Permission denied',
    })

    render(<CameraView />)
    expect(screen.getByText(/Permission denied/)).toBeInTheDocument()
  })

  it('renders the video element when the stream is ready', () => {
    vi.mocked(useCameraStream).mockReturnValue({
      status: 'ready',
      stream: { getTracks: () => [] } as unknown as MediaStream,
      errorMessage: null,
    })

    render(<CameraView />)
    expect(screen.getByTestId('camera-video')).toBeInTheDocument()
  })
})
