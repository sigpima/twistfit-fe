import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCameraStream } from './useCameraStream'

function makeFakeStream() {
  const stop = vi.fn()
  return {
    getTracks: () => [{ stop }],
    __stop: stop,
  } as unknown as MediaStream & { __stop: typeof stop }
}

beforeEach(() => {
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn(),
    },
  })
})

describe('useCameraStream', () => {
  it('sets status to ready and exposes the stream on success', async () => {
    const fakeStream = makeFakeStream()
    ;(navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValue(fakeStream)

    const { result } = renderHook(() => useCameraStream())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.stream).toBe(fakeStream)
    expect(result.current.errorMessage).toBeNull()
  })

  it('sets status to error with a message on permission denial', async () => {
    ;(navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Permission denied')
    )

    const { result } = renderHook(() => useCameraStream())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorMessage).toBe('Permission denied')
    expect(result.current.stream).toBeNull()
  })

  it('stops all tracks on unmount', async () => {
    const fakeStream = makeFakeStream()
    ;(navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValue(fakeStream)

    const { result, unmount } = renderHook(() => useCameraStream())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    unmount()

    expect(fakeStream.__stop).toHaveBeenCalledTimes(1)
  })
})
