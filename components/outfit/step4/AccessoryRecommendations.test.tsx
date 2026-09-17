import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AccessoryRecommendations from './AccessoryRecommendations'
import { OutfitFlowProvider } from '../OutfitFlowProvider'

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

  it('requests recommendations using the selected occasion and style', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider>
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/accessories/recommendations?occasion=hang-ngay&style=casual'),
        expect.anything()
      )
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
