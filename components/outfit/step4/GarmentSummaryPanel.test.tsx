import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import GarmentSummaryPanel from './GarmentSummaryPanel'
import { OutfitFlowProvider, DEFAULT_GARMENT } from '../OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('GarmentSummaryPanel', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('shows the garment selected in step 1', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <GarmentSummaryPanel />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(DEFAULT_GARMENT.name)).toBeInTheDocument()
  })

  it('restarts the flow at step 1 when trying something new', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <GarmentSummaryPanel />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Thử Mới/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-1')
  })
})
