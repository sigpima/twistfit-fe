import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step3PageContent from './Step3PageContent'
import { OutfitFlowProvider, useOutfitFlow, FALLBACK_MODEL } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function PickAlternateSelections() {
  const { setSelectedModel, setOccasionStyleMode, setSelectedStyle, setJobId } = useOutfitFlow()
  return (
    <button
      onClick={() => {
        setSelectedModel({ id: 'male-4', name: 'Mảnh khảnh', image: '/x.jpg', sideImage: null })
        setOccasionStyleMode('style')
        setSelectedStyle('formal')
        setJobId(42)
      }}
    >
      pick alternate selections
    </button>
  )
}

function FlowStateReadout() {
  const { selectedModel, occasionStyleMode, selectedOccasion, selectedStyle, jobId } = useOutfitFlow()
  return (
    <span data-testid="flow-state-readout">
      {selectedModel.name}|{occasionStyleMode}|{selectedOccasion}|{selectedStyle}|{String(jobId)}
    </span>
  )
}

describe('Step3PageContent', () => {
  beforeEach(() => {
    pushMock.mockClear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the result heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step3PageContent />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ' })).toBeInTheDocument()
  })

  it('starts a new outfit at step 1 when clicking Phối Đồ Mới', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step3PageContent />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Phối Đồ Mới/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-1')
  })

  it('resets the selected model, occasion/style, and job id when clicking Phối Đồ Mới', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <PickAlternateSelections />
        <FlowStateReadout />
        <Step3PageContent />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'pick alternate selections' }))
    expect(screen.getByTestId('flow-state-readout')).toHaveTextContent('Mảnh khảnh|style|hang-ngay|formal|42')

    fireEvent.click(screen.getByRole('button', { name: /Phối Đồ Mới/ }))

    expect(screen.getByTestId('flow-state-readout')).toHaveTextContent(
      `${FALLBACK_MODEL.name}|occasion|hang-ngay|casual|null`
    )
  })
})
