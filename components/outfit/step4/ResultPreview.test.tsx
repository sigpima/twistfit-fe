import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
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

  it('polls until the job is done, then shows the result image', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: 'processing' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'done', resultBlobUrl: 'https://example.com/result.png' }))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider>
        <SetJobId jobId={7} />
        <ResultPreview />
      </OutfitFlowProvider>
    )

    expect(screen.getByText('Đang xử lý phối đồ, vui lòng đợi...')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(3000)
    await waitFor(() => expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.com/result.png'))
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

  it('shows the selected model and garment tone once the job is done', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: 'done', resultBlobUrl: 'https://example.com/result.png' }))
    )

    renderWithIntl(
      <OutfitFlowProvider>
        <SetJobId jobId={1} />
        <ResultPreview />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(screen.getByText(/Carmen \(1m65\)/)).toBeInTheDocument())
    expect(screen.getByText(/Light Summer/)).toBeInTheDocument()
  })

  it('zooms the preview image when the zoom button is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: 'done', resultBlobUrl: 'https://example.com/result.png' }))
    )

    renderWithIntl(
      <OutfitFlowProvider>
        <SetJobId jobId={1} />
        <ResultPreview />
      </OutfitFlowProvider>
    )

    const image = await waitFor(() => screen.getByAltText(''))
    expect(image).toHaveStyle({ transform: 'scale(1)' })
    fireEvent.click(screen.getByTitle('Phóng to'))
    expect(image).toHaveStyle({ transform: 'scale(1.35)' })
  })

  it('shows a status message when toggling the 360 view', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: 'done', resultBlobUrl: 'https://example.com/result.png' }))
    )

    renderWithIntl(
      <OutfitFlowProvider>
        <SetJobId jobId={1} />
        <ResultPreview />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(screen.getByAltText('')).toBeInTheDocument())
    fireEvent.click(screen.getByTitle('Góc xoay 360'))
    expect(screen.getByText(/Đang tải mô hình không gian xoay 360/)).toBeInTheDocument()
  })
})
