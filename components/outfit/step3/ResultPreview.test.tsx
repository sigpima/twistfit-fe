import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ResultPreview from './ResultPreview'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

function SetJobId({ jobId }: { jobId: number | null }) {
  const { setJobId } = useOutfitFlow()
  setJobId(jobId)
  return null
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('ResultPreview', () => {
  it('shows a "no job" message when there is no job id', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ResultPreview />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Chưa có yêu cầu phối đồ nào.')).toBeInTheDocument()
  })

  it('polls until the job is done, then shows both the front and side result images', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: 'processing' }))
      .mockResolvedValueOnce(
        jsonResponse({
          status: 'done',
          resultFrontBlobUrl: 'https://example.com/front.png',
          resultSideBlobUrl: 'https://example.com/side.png',
        })
      )
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider>
        <SetJobId jobId={7} />
        <ResultPreview />
      </OutfitFlowProvider>
    )

    expect(screen.getByText('Đang xử lý phối đồ, vui lòng đợi...')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(3000)
    await waitFor(() =>
      expect(screen.getByAltText('Ảnh trực diện')).toHaveAttribute('src', 'https://example.com/front.png')
    )
    expect(screen.getByAltText('Ảnh nghiêng')).toHaveAttribute('src', 'https://example.com/side.png')
  })

  it('shows only the front result image when the model has no side pose', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ status: 'done', resultFrontBlobUrl: 'https://example.com/front.png', resultSideBlobUrl: null })
      )
    )

    renderWithIntl(
      <OutfitFlowProvider>
        <SetJobId jobId={8} />
        <ResultPreview />
      </OutfitFlowProvider>
    )

    await waitFor(() =>
      expect(screen.getByAltText('Ảnh trực diện')).toHaveAttribute('src', 'https://example.com/front.png')
    )
    expect(screen.queryByAltText('Ảnh nghiêng')).not.toBeInTheDocument()
  })

  it('shows the error message when the job fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: 'failed', errorMessage: 'Không tìm thấy món đồ phù hợp' }))
    )

    renderWithIntl(
      <OutfitFlowProvider>
        <SetJobId jobId={9} />
        <ResultPreview />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(screen.getByText('Không tìm thấy món đồ phù hợp')).toBeInTheDocument())
  })
})
