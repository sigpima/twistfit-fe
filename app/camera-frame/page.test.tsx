import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useCameraStream } from '@/hooks/useCameraStream'
import { PALETTES } from '@/lib/palettes'
import CameraFramePage from './page'

vi.mock('@/hooks/useCameraStream', () => ({
  useCameraStream: vi.fn(),
}))

const searchParamsMock = { get: vi.fn() }

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsMock,
}))

describe('CameraFramePage', () => {
  it('starts on the palette named in the ?palette= query param', () => {
    vi.mocked(useCameraStream).mockReturnValue({ status: 'ready', stream: null, errorMessage: null })
    searchParamsMock.get.mockReturnValue('winter-cool')

    render(<CameraFramePage />)

    const expected = PALETTES.find((palette) => palette.id === 'winter-cool')!
    expect(screen.getByText(expected.name)).toBeInTheDocument()
  })

  it('starts on the first palette when there is no ?palette= query param', () => {
    vi.mocked(useCameraStream).mockReturnValue({ status: 'ready', stream: null, errorMessage: null })
    searchParamsMock.get.mockReturnValue(null)

    render(<CameraFramePage />)

    expect(screen.getByText(PALETTES[0].name)).toBeInTheDocument()
  })
})
