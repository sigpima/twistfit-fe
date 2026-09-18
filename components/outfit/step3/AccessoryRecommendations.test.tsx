import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AccessoryRecommendations from './AccessoryRecommendations'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'
import { useEffect } from 'react'

function SetStyleMode() {
  const { setOccasionStyleMode, setSelectedStyle } = useOutfitFlow()
  useEffect(() => {
    setOccasionStyleMode('style')
    setSelectedStyle('formal')
  }, [setOccasionStyleMode, setSelectedStyle])
  return null
}

function jsonResponse(body: unknown, init: { ok?: boolean } = {}) {
  return { ok: init.ok ?? true, json: async () => body }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AccessoryRecommendations', () => {
  it('renders recommended accessories with a working buy link', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            id: 1,
            name: 'Túi tote nâu',
            imageUrl: '/tote.png',
            affiliateLink: 'https://shop.example.com/tote',
            category: 'tui-xach',
          },
        ])
      )
    )

    renderWithIntl(
      <OutfitFlowProvider>
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(screen.getByText('Túi tote nâu')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Túi tote nâu/ })).toHaveAttribute(
      'href',
      'https://shop.example.com/tote'
    )
  })

  it('requests recommendations using only the active occasion axis by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider>
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/accessories/recommendations?occasion=hang-ngay',
        expect.anything()
      )
    )
  })

  it('requests recommendations using only the active style axis when in style mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider>
        <SetStyleMode />
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/accessories/recommendations?style=formal', expect.anything())
    )
  })

  it('renders nothing when there are no recommendations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])))

    const { container } = renderWithIntl(
      <OutfitFlowProvider>
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false })))

    const { container } = renderWithIntl(
      <OutfitFlowProvider>
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
