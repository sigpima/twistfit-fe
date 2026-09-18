import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step2PageContent from './Step2PageContent'
import { OutfitFlowProvider, useOutfitFlow, FALLBACK_MODEL } from '../OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'

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

const MODELS: CatalogModel[] = [
  {
    id: 1,
    name: 'Mảnh mai',
    image: '/outfit/models/female-1.jpg',
    dossierImage: '/outfit/models/female-1.jpg',
    sideImage: '/outfit/models/female-1-side.jpg',
    poseCount: 2,
    tagline: '—',
    undertone: 'neutral',
    height: '—',
    bodyShape: '—',
    waist: '—',
    personalColor: '—',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('Step2PageContent', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the step heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Bước 2: Chọn Người Mẫu' })).toBeInTheDocument()
  })

  it('links back to step 1', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Quay lại Bước 1/ })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('creates a try-on job and navigates to step 3 with the job id stored', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 77 }, { status: 201 })))

    renderWithIntl(
      <OutfitFlowProvider initialModel={{ ...FALLBACK_MODEL, id: '42' }}>
        <JobIdProbe />
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận người mẫu/ }))

    await waitFor(() => expect(screen.getByText('jobId: 77')).toBeInTheDocument())
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-3')
  })

  it('sends only the active occasion/style axis, leaving the other null', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 77 }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider initialModel={{ ...FALLBACK_MODEL, id: '42' }}>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận người mẫu/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init.body as string)).toEqual({
      catalogModelId: 42,
      occasion: 'hang-ngay',
      style: null,
    })
  })

  it('does not navigate when job creation fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))

    renderWithIntl(
      <OutfitFlowProvider initialModel={{ ...FALLBACK_MODEL, id: '42' }}>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận người mẫu/ }))

    await waitFor(() => expect(screen.getByText(/không thể tạo/i)).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('shows an error without calling the API when no real model is selected (fallback id)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 77 }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận người mẫu/ }))

    await waitFor(() => expect(screen.getByText(/không thể tạo/i)).toBeInTheDocument())
    expect(fetchMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })
})
