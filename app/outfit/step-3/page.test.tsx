import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step3Page from './page'
import { OutfitFlowProvider, useOutfitFlow, FALLBACK_MODEL } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

function JobIdProbe() {
  const { jobId } = useOutfitFlow()
  return <p>jobId: {jobId ?? 'none'}</p>
}

describe('Step3Page', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the step heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step3Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Bước 3: Chọn Góc Nhìn' })).toBeInTheDocument()
  })

  it('links back to step 2', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step3Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('button', { name: /Quay lại Bước 2/ })).toBeInTheDocument()
  })

  it('creates a try-on job and stores the job id before navigating', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 77 }, { status: 201 })))

    renderWithIntl(
      <OutfitFlowProvider initialModel={{ ...FALLBACK_MODEL, id: '42' }}>
        <JobIdProbe />
        <Step3Page />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Tạo Đồ Ảo Ngay/ }))

    await waitFor(() => expect(screen.getByText('jobId: 77')).toBeInTheDocument())
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-4')
  })

  it('does not navigate when job creation fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))

    renderWithIntl(
      <OutfitFlowProvider initialModel={{ ...FALLBACK_MODEL, id: '42' }}>
        <Step3Page />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Tạo Đồ Ảo Ngay/ }))

    await waitFor(() => expect(screen.getByText(/không thể tạo/i)).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('shows an error without calling the API when no real model is selected (fallback id)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 77 }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider>
        <Step3Page />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Tạo Đồ Ảo Ngay/ }))

    await waitFor(() => expect(screen.getByText(/không thể tạo/i)).toBeInTheDocument())
    expect(fetchMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })
})
